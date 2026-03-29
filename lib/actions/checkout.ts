"use server";

import { auth } from "@/auth";
import { AuditAction, AuditEntityType } from "@prisma/client";
import { writeAuditLog } from "@/lib/audit";
import {
  failure,
  zodErrorToFieldErrors,
  type ActionResult,
} from "@/lib/form/action-result";
import { checkoutCreateSchema, checkoutReturnSchema } from "@/lib/schemas/checkout";
import { createSingleCheckout } from "@/lib/checkout/create-single-checkout";
import { hasRole, LAB_ROLE } from "@/lib/auth/roles";
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
  const created = await createSingleCheckout(prisma, {
    userId: session.user!.id,
    assetId: parsed.data.assetId,
    assetUnitId: parsed.data.assetUnitId,
    projectId: parsed.data.projectId,
    purpose: parsed.data.purpose,
    dueAt: due,
    conditionOut: parsed.data.conditionNote
      ? { note: parsed.data.conditionNote }
      : undefined,
  });
  if (!created.ok) {
    if (created.fieldErrors) {
      return failure({ fieldErrors: created.fieldErrors, formError: created.formError });
    }
    return failure({ formError: created.formError });
  }
  const checkout = { id: created.checkoutId };

  await writeAuditLog({
    userId: session.user.id,
    entityType: AuditEntityType.Checkout,
    entityId: checkout.id,
    action: AuditAction.CREATE,
    diff: {
      assetId: parsed.data.assetId,
      assetUnitId: parsed.data.assetUnitId ?? undefined,
      projectId: parsed.data.projectId ?? undefined,
      dueAt: due.toISOString(),
      ...(parsed.data.purpose != null ? { purpose: parsed.data.purpose } : {}),
    },
  });

  revalidatePath("/inventory");
  revalidatePath(`/inventory/${parsed.data.assetId}`);
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
  if (co.status !== "ACTIVE" && co.status !== "OVERDUE") {
    return failure({ formError: "This checkout is already closed." });
  }

  const isAdmin = hasRole(session.user.roles, LAB_ROLE.ADMIN);
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
    entityType: AuditEntityType.Checkout,
    entityId: co.id,
    action: AuditAction.RETURN,
    diff: {
      assetId: co.assetId,
      previousStatus: co.status,
      returnedAt: new Date().toISOString(),
    },
  });

  revalidatePath("/inventory");
  revalidatePath(`/inventory/${co.assetId}`);
  revalidatePath("/checkouts");
  redirect("/checkouts");
}
