"use server";

import { auth } from "@/auth";
import { AuditAction, AuditEntityType } from "@prisma/client";
import { writeAuditLog } from "@/lib/audit";
import { assetAuditSnapshot, changedFieldDiff } from "@/lib/audit/asset-diff";
import { assertAnyRole, LAB_ROLES_ADMIN_ONLY, LAB_ROLES_STAFF } from "@/lib/auth/roles";
import {
  failure,
  zodErrorToFieldErrors,
  type ActionResult,
} from "@/lib/form/action-result";
import { assetCreateSchema, assetUpdateSchema } from "@/lib/schemas/asset";
import {
  LookupValidationError,
  requireActiveLookupCode,
} from "@/lib/reference/lookup-validation";
import { prisma } from "@/lib/db";
import { notDeleted } from "@/lib/prisma/active-scopes";
import { appendArchivedSuffix } from "@/lib/soft-delete/archive-keys";
import { randomBytes } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

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
    assertAnyRole(session.user.roles, LAB_ROLES_STAFF);
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
    conditionCode: formData.get("conditionCode"),
    operationalStatusCode: formData.get("operationalStatusCode"),
    quantityTotal: formData.get("quantityTotal"),
    quantityAvailable: formData.get("quantityAvailable"),
    notes: formData.get("notes") as string | undefined,
    quoteUrl: formData.get("quoteUrl") as string | undefined,
    categoryId: formData.get("categoryId") as string | undefined,
    locationId: formData.get("locationId") as string | undefined,
    projectId: formData.get("projectId") as string | undefined,
    custodianUserId: formData.get("custodianUserId") as string | undefined,
    acquiredAt: formData.get("acquiredAt") as string | undefined,
    trackTag: formData.get("trackTag") as string | undefined,
  };

  const parsed = assetCreateSchema.safeParse({
    ...raw,
    categoryId: raw.categoryId || undefined,
    locationId: raw.locationId || undefined,
    projectId: raw.projectId || undefined,
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
  try {
    await requireActiveLookupCode(prisma, "ASSET_CONDITION", d.conditionCode);
    await requireActiveLookupCode(
      prisma,
      "ASSET_OPERATIONAL_STATUS",
      d.operationalStatusCode,
    );
  } catch (e) {
    const msg = e instanceof LookupValidationError ? e.message : "Invalid lookup value.";
    return failure({ formError: msg });
  }

  const qtyAvail =
    d.quantityAvailable ?? d.quantityTotal;

  if (qtyAvail > d.quantityTotal) {
    return failure({
      fieldErrors: {
        quantityAvailable: ["Cannot exceed total quantity"],
      },
    });
  }

  const pidCreate = d.projectId?.trim();
  let projectIdForCreate: string | undefined;
  if (pidCreate) {
    const projRow = await prisma.project.findFirst({
      where: { id: pidCreate, ...notDeleted },
    });
    if (!projRow) {
      return failure({ fieldErrors: { projectId: ["Unknown project."] } });
    }
    projectIdForCreate = pidCreate;
  }

  let asset;
  try {
    asset = await prisma.asset.create({
      data: {
        skuOrInternalId: d.skuOrInternalId.trim(),
        name: d.name.trim(),
        specs: parseSpecs(d.specs),
        conditionCode: d.conditionCode,
        operationalStatusCode: d.operationalStatusCode,
        quantityTotal: d.quantityTotal,
        quantityAvailable: qtyAvail,
        notes: d.notes?.trim() || undefined,
        quoteUrl: d.quoteUrl?.trim() || undefined,
        imagePath,
        categoryId: d.categoryId || undefined,
        locationId: d.locationId || undefined,
        projectId: projectIdForCreate,
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
    entityType: AuditEntityType.Asset,
    entityId: asset.id,
    action: AuditAction.CREATE,
    diff: { skuOrInternalId: asset.skuOrInternalId, name: asset.name },
  });

  revalidatePath("/inventory");
  revalidatePath(`/inventory/${asset.id}`);
  if (asset.projectId) {
    revalidatePath(`/projects/${asset.projectId}`);
  }
  redirect(`/inventory/${asset.id}`);
}

export async function updateAssetAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return failure({ formError: "Sign in required." });
  try {
    assertAnyRole(session.user.roles, LAB_ROLES_STAFF);
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
    conditionCode: formData.get("conditionCode"),
    operationalStatusCode: formData.get("operationalStatusCode"),
    quantityTotal: formData.get("quantityTotal"),
    quantityAvailable: formData.get("quantityAvailable"),
    notes: formData.get("notes") as string | undefined,
    quoteUrl: formData.get("quoteUrl") as string | undefined,
    categoryId: formData.get("categoryId") as string | undefined,
    locationId: formData.get("locationId") as string | undefined,
    projectId: formData.get("projectId") as string | undefined,
    custodianUserId: formData.get("custodianUserId") as string | undefined,
    acquiredAt: formData.get("acquiredAt") as string | undefined,
    trackTag: formData.get("trackTag") as string | undefined,
  };

  const parsed = assetUpdateSchema.safeParse({
    ...raw,
    categoryId: raw.categoryId || undefined,
    locationId: raw.locationId || undefined,
    projectId: raw.projectId || undefined,
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
  try {
    await requireActiveLookupCode(prisma, "ASSET_CONDITION", d.conditionCode);
    await requireActiveLookupCode(
      prisma,
      "ASSET_OPERATIONAL_STATUS",
      d.operationalStatusCode,
    );
  } catch (e) {
    const msg = e instanceof LookupValidationError ? e.message : "Invalid lookup value.";
    return failure({ formError: msg });
  }

  const existing = await prisma.asset.findFirst({
    where: { id: d.id, ...notDeleted },
  });
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

  const pidUpdate = d.projectId?.trim();
  let projectIdForUpdate: string | null = null;
  if (pidUpdate) {
    const projRow = await prisma.project.findFirst({
      where: { id: pidUpdate, ...notDeleted },
    });
    if (!projRow) {
      return failure({ fieldErrors: { projectId: ["Unknown project."] } });
    }
    projectIdForUpdate = pidUpdate;
  }

  const data: Parameters<typeof prisma.asset.update>[0]["data"] = {
    skuOrInternalId: d.skuOrInternalId.trim(),
    name: d.name.trim(),
    specs: parseSpecs(d.specs) ?? undefined,
    conditionCode: d.conditionCode,
    operationalStatusCode: d.operationalStatusCode,
    quantityTotal: d.quantityTotal,
    quantityAvailable: qtyAvail,
    notes: d.notes?.trim() || undefined,
    quoteUrl: d.quoteUrl?.trim() || undefined,
    categoryId: d.categoryId || null,
    locationId: d.locationId || null,
    projectId: projectIdForUpdate,
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

  const beforeSnap = assetAuditSnapshot(existing);
  const afterSnap = assetAuditSnapshot(updated);
  await writeAuditLog({
    userId: session.user.id,
    entityType: AuditEntityType.Asset,
    entityId: updated.id,
    action: AuditAction.UPDATE,
    diff: changedFieldDiff(beforeSnap, afterSnap),
  });

  revalidatePath("/inventory");
  revalidatePath(`/inventory/${updated.id}`);
  const projectPaths = new Set<string>();
  if (existing.projectId) projectPaths.add(`/projects/${existing.projectId}`);
  if (updated.projectId) projectPaths.add(`/projects/${updated.projectId}`);
  for (const p of projectPaths) revalidatePath(p);

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
    assertAnyRole(session.user.roles, LAB_ROLES_ADMIN_ONLY);
  } catch {
    return failure({ formError: "Only admins can delete assets." });
  }

  const open = await prisma.checkout.count({
    where: { assetId, status: { in: ["ACTIVE", "OVERDUE"] } },
  });
  if (open > 0) {
    return failure({ formError: "Close all checkouts before deleting." });
  }

  const toRemove = await prisma.asset.findFirst({
    where: { id: assetId, ...notDeleted },
  });
  if (!toRemove) {
    return failure({ formError: "Asset not found." });
  }

  const now = new Date();
  const newSku = appendArchivedSuffix(toRemove.skuOrInternalId, toRemove.id, 200);
  const newTrackTag =
    toRemove.trackTag != null && toRemove.trackTag !== ""
      ? appendArchivedSuffix(toRemove.trackTag, toRemove.id, 200)
      : null;

  const units = await prisma.assetUnit.findMany({
    where: { assetId, ...notDeleted },
  });

  try {
    await prisma.$transaction([
      ...units.map((u) => {
        const tag =
          u.trackTag != null && u.trackTag !== ""
            ? appendArchivedSuffix(u.trackTag, u.id, 200)
            : null;
        return prisma.assetUnit.update({
          where: { id: u.id },
          data: { deletedAt: now, trackTag: tag },
        });
      }),
      prisma.asset.update({
        where: { id: assetId },
        data: {
          deletedAt: now,
          skuOrInternalId: newSku,
          trackTag: newTrackTag,
        },
      }),
    ]);
  } catch {
    return failure({ formError: "Could not archive asset." });
  }

  await writeAuditLog({
    userId: session.user.id,
    entityType: AuditEntityType.Asset,
    entityId: assetId,
    action: AuditAction.DELETE,
    diff: {
      skuOrInternalId: toRemove.skuOrInternalId,
      name: toRemove.name,
      soft: true,
    },
  });
  revalidatePath("/inventory");
  redirect("/inventory");
}
