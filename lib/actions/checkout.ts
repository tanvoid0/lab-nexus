"use server";

import { auth } from "@/auth";
import { writeAuditLog } from "@/lib/audit";
import {
  failure,
  zodErrorToFieldErrors,
  type ActionResult,
} from "@/lib/form/action-result";
import { checkoutCreateSchema, checkoutReturnSchema } from "@/lib/schemas/checkout";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createCheckoutAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return failure({ formError: "Sign in required." });

  const raw = {
    assetId: formData.get("assetId"),
    assetUnitId: (formData.get("assetUnitId") as string) || undefined,
    projectId: formData.get("projectId") as string | undefined,
    purpose: formData.get("purpose"),
    dueAt: formData.get("dueAt"),
    conditionNote: formData.get("conditionNote") as string | undefined,
  };

  const parsed = checkoutCreateSchema.safeParse({
    ...raw,
    projectId: raw.projectId || undefined,
    assetUnitId: raw.assetUnitId || undefined,
  });
  if (!parsed.success) {
    return failure({ fieldErrors: zodErrorToFieldErrors(parsed.error) });
  }

  const due = new Date(parsed.data.dueAt);
  if (Number.isNaN(due.getTime())) {
    return failure({ fieldErrors: { dueAt: ["Invalid date"] } });
  }
  if (due.getTime() < Date.now()) {
    return failure({ fieldErrors: { dueAt: ["Due date must be in the future"] } });
  }

  const asset = await prisma.asset.findUnique({
    where: { id: parsed.data.assetId },
    include: {
      _count: { select: { units: true } },
    },
  });
  if (!asset) return failure({ formError: "Asset not found." });
  if (asset.operationalStatus !== "AVAILABLE") {
    return failure({ formError: "Asset is not available for checkout." });
  }
  if (asset.quantityAvailable < 1) {
    return failure({ formError: "No units available." });
  }

  const unitCount = asset._count.units;
  let assetUnitId: string | undefined;

  if (unitCount > 0) {
    const uid = parsed.data.assetUnitId?.trim();
    if (!uid) {
      return failure({
        fieldErrors: { assetUnitId: ["Select a serial / unit to check out."] },
      });
    }
    const unit = await prisma.assetUnit.findFirst({
      where: { id: uid, assetId: asset.id },
    });
    if (!unit) {
      return failure({ fieldErrors: { assetUnitId: ["Invalid unit for this asset."] } });
    }
    const busy = await prisma.checkout.findFirst({
      where: {
        assetUnitId: unit.id,
        status: { in: ["ACTIVE", "OVERDUE"] },
      },
    });
    if (busy) {
      return failure({ fieldErrors: { assetUnitId: ["That unit is already on loan."] } });
    }
    assetUnitId = unit.id;
  } else if (parsed.data.assetUnitId?.trim()) {
    return failure({ fieldErrors: { assetUnitId: ["This asset does not use tracked units."] } });
  }

  let checkout;
  try {
    checkout = await prisma.checkout.create({
      data: {
        userId: session.user!.id,
        assetId: asset.id,
        assetUnitId,
        projectId: parsed.data.projectId || undefined,
        purpose: parsed.data.purpose.trim(),
        dueAt: due,
        conditionOut: parsed.data.conditionNote
          ? { note: parsed.data.conditionNote }
          : undefined,
      },
    });
    await prisma.asset.update({
      where: { id: asset.id },
      data: { quantityAvailable: { decrement: 1 } },
    });
  } catch (e) {
    return failure({
      formError: e instanceof Error ? e.message : "Checkout failed.",
    });
  }

  await writeAuditLog({
    userId: session.user.id,
    entityType: "Checkout",
    entityId: checkout.id,
    action: "CREATE",
    diff: { assetId: asset.id },
  });

  revalidatePath("/inventory");
  revalidatePath(`/inventory/${asset.id}`);
  revalidatePath("/checkouts");
  redirect("/checkouts");
}

export async function returnCheckoutAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return failure({ formError: "Sign in required." });

  const raw = {
    checkoutId: formData.get("checkoutId"),
    conditionNote: formData.get("conditionNote") as string | undefined,
    damageReport: formData.get("damageReport") as string | undefined,
  };
  const parsed = checkoutReturnSchema.safeParse(raw);
  if (!parsed.success) {
    return failure({ fieldErrors: zodErrorToFieldErrors(parsed.error) });
  }

  const co = await prisma.checkout.findUnique({
    where: { id: parsed.data.checkoutId },
    include: { asset: true },
  });
  if (!co) return failure({ formError: "Checkout not found." });
  if (co.status !== "ACTIVE") {
    return failure({ formError: "This checkout is already closed." });
  }

  const isAdmin = session.user.roles.includes("ADMIN");
  const isOwner = co.userId === session.user.id;
  if (!isOwner && !isAdmin) {
    return failure({ formError: "You can only return your own checkouts." });
  }

  await prisma.checkout.update({
    where: { id: co.id },
    data: {
      status: "RETURNED",
      returnedAt: new Date(),
      conditionIn: parsed.data.conditionNote
        ? { note: parsed.data.conditionNote }
        : undefined,
      damageReport: parsed.data.damageReport?.trim() || undefined,
    },
  });
  await prisma.asset.update({
    where: { id: co.assetId },
    data: { quantityAvailable: { increment: 1 } },
  });

  await writeAuditLog({
    userId: session.user.id,
    entityType: "Checkout",
    entityId: co.id,
    action: "RETURN",
    diff: { assetId: co.assetId },
  });

  revalidatePath("/inventory");
  revalidatePath(`/inventory/${co.assetId}`);
  revalidatePath("/checkouts");
  redirect("/checkouts");
}
