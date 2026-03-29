"use server";

import { auth } from "@/auth";
import { writeAuditLog } from "@/lib/audit";
import { assertAnyRole } from "@/lib/auth/roles";
import {
  failure,
  zodErrorToFieldErrors,
  type ActionResult,
} from "@/lib/form/action-result";
import { assetCreateSchema, assetUpdateSchema } from "@/lib/schemas/asset";
import { prisma } from "@/lib/db";
import { randomBytes } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const CAN_EDIT = ["ADMIN", "RESEARCHER"] as const;

function parseSpecs(raw: string | undefined): object | undefined {
  if (!raw?.trim()) return undefined;
  try {
    return JSON.parse(raw) as object;
  } catch {
    return { text: raw };
  }
}

async function saveUpload(file: File | null): Promise<string | undefined> {
  if (!file || file.size === 0) return undefined;
  const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowed.includes(file.type)) {
    throw new Error("Invalid image type");
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Image too large (max 5MB)");
  }
  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  const name = `${Date.now()}-${randomBytes(8).toString("hex")}.${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  const buf = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, name), buf);
  return `/uploads/${name}`;
}

export async function createAssetAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return failure({ formError: "Sign in required." });
  try {
    assertAnyRole(session.user.roles, CAN_EDIT);
  } catch {
    return failure({ formError: "You cannot create assets." });
  }

  const file = formData.get("image") as File | null;
  let imagePath: string | undefined;
  try {
    imagePath = await saveUpload(file);
  } catch (e) {
    return failure({
      formError: e instanceof Error ? e.message : "Image upload failed.",
    });
  }

  const raw = {
    skuOrInternalId: formData.get("skuOrInternalId"),
    name: formData.get("name"),
    specs: formData.get("specs") as string | undefined,
    condition: formData.get("condition"),
    operationalStatus: formData.get("operationalStatus"),
    quantityTotal: formData.get("quantityTotal"),
    quantityAvailable: formData.get("quantityAvailable"),
    notes: formData.get("notes") as string | undefined,
    quoteUrl: formData.get("quoteUrl") as string | undefined,
    categoryId: formData.get("categoryId") as string | undefined,
    locationId: formData.get("locationId") as string | undefined,
    custodianUserId: formData.get("custodianUserId") as string | undefined,
    acquiredAt: formData.get("acquiredAt") as string | undefined,
    trackTag: formData.get("trackTag") as string | undefined,
  };

  const parsed = assetCreateSchema.safeParse({
    ...raw,
    categoryId: raw.categoryId || undefined,
    locationId: raw.locationId || undefined,
    custodianUserId: raw.custodianUserId || undefined,
    quoteUrl: raw.quoteUrl || undefined,
    trackTag: raw.trackTag || undefined,
    quantityAvailable:
      raw.quantityAvailable === "" || raw.quantityAvailable == null
        ? undefined
        : raw.quantityAvailable,
  });

  if (!parsed.success) {
    return failure({ fieldErrors: zodErrorToFieldErrors(parsed.error) });
  }

  const d = parsed.data;
  const qtyAvail =
    d.quantityAvailable ?? d.quantityTotal;

  if (qtyAvail > d.quantityTotal) {
    return failure({
      fieldErrors: {
        quantityAvailable: ["Cannot exceed total quantity"],
      },
    });
  }

  let asset;
  try {
    asset = await prisma.asset.create({
      data: {
        skuOrInternalId: d.skuOrInternalId.trim(),
        name: d.name.trim(),
        specs: parseSpecs(d.specs),
        condition: d.condition,
        operationalStatus: d.operationalStatus,
        quantityTotal: d.quantityTotal,
        quantityAvailable: qtyAvail,
        notes: d.notes?.trim() || undefined,
        quoteUrl: d.quoteUrl?.trim() || undefined,
        imagePath,
        categoryId: d.categoryId || undefined,
        locationId: d.locationId || undefined,
        custodianUserId: d.custodianUserId || undefined,
        trackTag: d.trackTag?.trim() || undefined,
        acquiredAt: d.acquiredAt ? new Date(d.acquiredAt) : undefined,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Create failed";
    if (msg.includes("Unique")) {
      return failure({ formError: "SKU / internal ID or track tag already exists." });
    }
    return failure({ formError: msg });
  }

  await writeAuditLog({
    userId: session.user.id,
    entityType: "Asset",
    entityId: asset.id,
    action: "CREATE",
    diff: { skuOrInternalId: asset.skuOrInternalId, name: asset.name },
  });

  revalidatePath("/inventory");
  revalidatePath(`/inventory/${asset.id}`);
  redirect(`/inventory/${asset.id}`);
}

export async function updateAssetAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return failure({ formError: "Sign in required." });
  try {
    assertAnyRole(session.user.roles, CAN_EDIT);
  } catch {
    return failure({ formError: "You cannot edit assets." });
  }

  const file = formData.get("image") as File | null;
  let imagePath: string | undefined;
  try {
    const up = await saveUpload(file);
    if (up) imagePath = up;
  } catch (e) {
    return failure({
      formError: e instanceof Error ? e.message : "Image upload failed.",
    });
  }

  const raw = {
    id: formData.get("id"),
    skuOrInternalId: formData.get("skuOrInternalId"),
    name: formData.get("name"),
    specs: formData.get("specs") as string | undefined,
    condition: formData.get("condition"),
    operationalStatus: formData.get("operationalStatus"),
    quantityTotal: formData.get("quantityTotal"),
    quantityAvailable: formData.get("quantityAvailable"),
    notes: formData.get("notes") as string | undefined,
    quoteUrl: formData.get("quoteUrl") as string | undefined,
    categoryId: formData.get("categoryId") as string | undefined,
    locationId: formData.get("locationId") as string | undefined,
    custodianUserId: formData.get("custodianUserId") as string | undefined,
    acquiredAt: formData.get("acquiredAt") as string | undefined,
    trackTag: formData.get("trackTag") as string | undefined,
  };

  const parsed = assetUpdateSchema.safeParse({
    ...raw,
    categoryId: raw.categoryId || undefined,
    locationId: raw.locationId || undefined,
    custodianUserId: raw.custodianUserId || undefined,
    quoteUrl: raw.quoteUrl || undefined,
    trackTag: raw.trackTag || undefined,
    quantityAvailable:
      raw.quantityAvailable === "" || raw.quantityAvailable == null
        ? undefined
        : raw.quantityAvailable,
  });

  if (!parsed.success) {
    return failure({ fieldErrors: zodErrorToFieldErrors(parsed.error) });
  }

  const d = parsed.data;
  const existing = await prisma.asset.findUnique({ where: { id: d.id } });
  if (!existing) return failure({ formError: "Asset not found." });

  const activeCheckouts = await prisma.checkout.count({
    where: { assetId: d.id, status: "ACTIVE" },
  });

  const qtyAvail = d.quantityAvailable ?? d.quantityTotal;
  if (qtyAvail > d.quantityTotal) {
    return failure({
      fieldErrors: { quantityAvailable: ["Cannot exceed total quantity"] },
    });
  }
  if (d.quantityTotal < activeCheckouts) {
    return failure({
      formError: `Total quantity must be at least ${activeCheckouts} (active checkouts).`,
    });
  }
  if (qtyAvail + activeCheckouts > d.quantityTotal) {
    return failure({
      formError: `Available units plus ${activeCheckouts} active checkout(s) cannot exceed total.`,
    });
  }

  const data: Parameters<typeof prisma.asset.update>[0]["data"] = {
    skuOrInternalId: d.skuOrInternalId.trim(),
    name: d.name.trim(),
    specs: parseSpecs(d.specs) ?? undefined,
    condition: d.condition,
    operationalStatus: d.operationalStatus,
    quantityTotal: d.quantityTotal,
    quantityAvailable: qtyAvail,
    notes: d.notes?.trim() || undefined,
    quoteUrl: d.quoteUrl?.trim() || undefined,
    categoryId: d.categoryId || null,
    locationId: d.locationId || null,
    custodianUserId: d.custodianUserId || null,
    trackTag: d.trackTag?.trim() || null,
    acquiredAt: d.acquiredAt ? new Date(d.acquiredAt) : null,
  };
  if (imagePath) data.imagePath = imagePath;

  let updated;
  try {
    updated = await prisma.asset.update({
      where: { id: d.id },
      data,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Update failed";
    if (msg.includes("Unique")) {
      return failure({ formError: "SKU / internal ID or track tag conflict." });
    }
    return failure({ formError: msg });
  }

  await writeAuditLog({
    userId: session.user.id,
    entityType: "Asset",
    entityId: updated.id,
    action: "UPDATE",
    diff: { skuOrInternalId: updated.skuOrInternalId },
  });

  revalidatePath("/inventory");
  revalidatePath(`/inventory/${updated.id}`);
  redirect(`/inventory/${updated.id}`);
}

export async function deleteAssetFormAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const assetId = formData.get("assetId");
  if (typeof assetId !== "string" || !assetId) {
    return failure({ formError: "Missing asset." });
  }

  const session = await auth();
  if (!session?.user?.id) return failure({ formError: "Sign in required." });
  try {
    assertAnyRole(session.user.roles, ["ADMIN"]);
  } catch {
    return failure({ formError: "Only admins can delete assets." });
  }

  const open = await prisma.checkout.count({
    where: { assetId, status: { in: ["ACTIVE", "OVERDUE"] } },
  });
  if (open > 0) {
    return failure({ formError: "Close all checkouts before deleting." });
  }

  try {
    await prisma.asset.delete({ where: { id: assetId } });
  } catch {
    return failure({ formError: "Could not delete asset." });
  }

  await writeAuditLog({
    userId: session.user.id,
    entityType: "Asset",
    entityId: assetId,
    action: "DELETE",
  });
  revalidatePath("/inventory");
  redirect("/inventory");
}
