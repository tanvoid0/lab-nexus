"use server";

import { auth } from "@/auth";
import { assertAnyRole, LAB_ROLES_ADMIN_ONLY } from "@/lib/auth/roles";
import { writeAuditLog } from "@/lib/audit";
import {
  failure,
  success,
  zodErrorToFieldErrors,
  type ActionResult,
} from "@/lib/form/action-result";
import { prisma } from "@/lib/db";
import { notDeleted } from "@/lib/prisma/active-scopes";
import { appendArchivedSuffix } from "@/lib/soft-delete/archive-keys";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { AuditAction, AuditEntityType } from "@prisma/client";

const nameSchema = z.object({
  name: z.string().min(1).max(200),
});

const idSchema = z.object({
  id: z.string().min(1),
});

const categoryUpdateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(200),
});

const locationUpdateSchema = categoryUpdateSchema;

const lookupCreateSchema = z.object({
  domain: z.enum(["ASSET_CONDITION", "ASSET_OPERATIONAL_STATUS"]),
  code: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[A-Za-z0-9_]+$/, "Use letters, numbers, underscores"),
  label: z.string().min(1).max(200),
  sortOrder: z.coerce.number().int().min(0).max(9999).optional(),
  description: z.string().max(500).optional(),
});

const lookupUpdateSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1).max(200),
  sortOrder: z.coerce.number().int().min(0).max(9999),
  isActive: z.enum(["on", "off"]).optional(),
  description: z.string().max(500).optional(),
});

function revalidateReferencePaths() {
  revalidatePath("/admin");
  revalidatePath("/admin/reference-data");
  revalidatePath("/inventory");
  revalidatePath("/admin/audit");
}

export async function createCategoryAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return failure({ formError: "Sign in required." });
  try {
    assertAnyRole(session.user.roles, LAB_ROLES_ADMIN_ONLY);
  } catch {
    return failure({ formError: "Forbidden." });
  }
  const parsed = nameSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return failure({ fieldErrors: zodErrorToFieldErrors(parsed.error) });
  }
  try {
    const row = await prisma.assetCategory.create({
      data: { name: parsed.data.name.trim() },
    });
    await writeAuditLog({
      userId: session.user.id,
      entityType: AuditEntityType.AssetCategory,
      entityId: row.id,
      action: AuditAction.CATEGORY_CREATE,
      diff: { name: row.name },
    });
    revalidateReferencePaths();
    return success();
  } catch {
    return failure({ formError: "Category name may already exist." });
  }
}

export async function updateCategoryAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return failure({ formError: "Sign in required." });
  try {
    assertAnyRole(session.user.roles, LAB_ROLES_ADMIN_ONLY);
  } catch {
    return failure({ formError: "Forbidden." });
  }
  const parsed = categoryUpdateSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
  });
  if (!parsed.success) {
    return failure({ fieldErrors: zodErrorToFieldErrors(parsed.error) });
  }
  const before = await prisma.assetCategory.findFirst({
    where: { id: parsed.data.id, ...notDeleted },
  });
  if (!before) return failure({ formError: "Category not found." });
  const name = parsed.data.name.trim();
  if (name === before.name) return success();
  try {
    await prisma.assetCategory.update({
      where: { id: parsed.data.id },
      data: { name },
    });
  } catch {
    return failure({ formError: "Another category already uses that name." });
  }
  await writeAuditLog({
    userId: session.user.id,
    entityType: AuditEntityType.AssetCategory,
    entityId: parsed.data.id,
    action: AuditAction.CATEGORY_UPDATE,
    diff: { name: { from: before.name, to: name } },
  });
  revalidateReferencePaths();
  return success();
}

export async function deleteCategoryAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return failure({ formError: "Sign in required." });
  try {
    assertAnyRole(session.user.roles, LAB_ROLES_ADMIN_ONLY);
  } catch {
    return failure({ formError: "Forbidden." });
  }
  const parsed = idSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) {
    return failure({ fieldErrors: zodErrorToFieldErrors(parsed.error) });
  }
  const n = await prisma.asset.count({
    where: { categoryId: parsed.data.id, ...notDeleted },
  });
  if (n > 0) {
    return failure({
      formError: `Cannot delete: ${n} asset(s) still use this category.`,
    });
  }
  const row = await prisma.assetCategory.findFirst({
    where: { id: parsed.data.id, ...notDeleted },
  });
  if (!row) return failure({ formError: "Category not found." });
  const archivedName = appendArchivedSuffix(row.name, row.id, 200);
  await prisma.assetCategory.update({
    where: { id: parsed.data.id },
    data: { deletedAt: new Date(), name: archivedName },
  });
  await writeAuditLog({
    userId: session.user.id,
    entityType: AuditEntityType.AssetCategory,
    entityId: parsed.data.id,
    action: AuditAction.CATEGORY_DELETE,
    diff: { name: row.name },
  });
  revalidateReferencePaths();
  return success();
}

export async function createLocationAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return failure({ formError: "Sign in required." });
  try {
    assertAnyRole(session.user.roles, LAB_ROLES_ADMIN_ONLY);
  } catch {
    return failure({ formError: "Forbidden." });
  }
  const parsed = nameSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return failure({ fieldErrors: zodErrorToFieldErrors(parsed.error) });
  }
  try {
    const row = await prisma.location.create({ data: { name: parsed.data.name.trim() } });
    await writeAuditLog({
      userId: session.user.id,
      entityType: AuditEntityType.Location,
      entityId: row.id,
      action: AuditAction.LOCATION_CREATE,
      diff: { name: row.name },
    });
    revalidateReferencePaths();
    return success();
  } catch {
    return failure({ formError: "Location name may already exist." });
  }
}

export async function updateLocationAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return failure({ formError: "Sign in required." });
  try {
    assertAnyRole(session.user.roles, LAB_ROLES_ADMIN_ONLY);
  } catch {
    return failure({ formError: "Forbidden." });
  }
  const parsed = locationUpdateSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
  });
  if (!parsed.success) {
    return failure({ fieldErrors: zodErrorToFieldErrors(parsed.error) });
  }
  const before = await prisma.location.findFirst({
    where: { id: parsed.data.id, ...notDeleted },
  });
  if (!before) return failure({ formError: "Location not found." });
  const name = parsed.data.name.trim();
  if (name === before.name) return success();
  try {
    await prisma.location.update({
      where: { id: parsed.data.id },
      data: { name },
    });
  } catch {
    return failure({ formError: "Another location already uses that name." });
  }
  await writeAuditLog({
    userId: session.user.id,
    entityType: AuditEntityType.Location,
    entityId: parsed.data.id,
    action: AuditAction.LOCATION_UPDATE,
    diff: { name: { from: before.name, to: name } },
  });
  revalidateReferencePaths();
  return success();
}

export async function deleteLocationAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return failure({ formError: "Sign in required." });
  try {
    assertAnyRole(session.user.roles, LAB_ROLES_ADMIN_ONLY);
  } catch {
    return failure({ formError: "Forbidden." });
  }
  const parsed = idSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) {
    return failure({ fieldErrors: zodErrorToFieldErrors(parsed.error) });
  }
  const n = await prisma.asset.count({
    where: { locationId: parsed.data.id, ...notDeleted },
  });
  if (n > 0) {
    return failure({
      formError: `Cannot delete: ${n} asset(s) still use this location.`,
    });
  }
  const row = await prisma.location.findFirst({
    where: { id: parsed.data.id, ...notDeleted },
  });
  if (!row) return failure({ formError: "Location not found." });
  const archivedName = appendArchivedSuffix(row.name, row.id, 200);
  await prisma.location.update({
    where: { id: parsed.data.id },
    data: { deletedAt: new Date(), name: archivedName },
  });
  await writeAuditLog({
    userId: session.user.id,
    entityType: AuditEntityType.Location,
    entityId: parsed.data.id,
    action: AuditAction.LOCATION_DELETE,
    diff: { name: row.name },
  });
  revalidateReferencePaths();
  return success();
}

export async function createLookupEntryAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return failure({ formError: "Sign in required." });
  try {
    assertAnyRole(session.user.roles, LAB_ROLES_ADMIN_ONLY);
  } catch {
    return failure({ formError: "Forbidden." });
  }
  const parsed = lookupCreateSchema.safeParse({
    domain: formData.get("domain"),
    code: formData.get("code"),
    label: formData.get("label"),
    sortOrder: formData.get("sortOrder") || undefined,
    description: formData.get("description") || undefined,
  });
  if (!parsed.success) {
    return failure({ fieldErrors: zodErrorToFieldErrors(parsed.error) });
  }
  const code = parsed.data.code.trim().toUpperCase();
  const domain = parsed.data.domain;
  try {
    const row = await prisma.lookupEntry.create({
      data: {
        domain,
        code,
        label: parsed.data.label.trim(),
        sortOrder: parsed.data.sortOrder ?? 100,
        isActive: true,
        isSystem: false,
        description: parsed.data.description?.trim() || undefined,
      },
    });
    await writeAuditLog({
      userId: session.user.id,
      entityType: AuditEntityType.LookupEntry,
      entityId: row.id,
      action: AuditAction.LOOKUP_CREATE,
      diff: { domain, code, label: row.label },
    });
    revalidateReferencePaths();
    return success();
  } catch {
    return failure({ formError: "That code already exists for this domain." });
  }
}

export async function updateLookupEntryAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return failure({ formError: "Sign in required." });
  try {
    assertAnyRole(session.user.roles, LAB_ROLES_ADMIN_ONLY);
  } catch {
    return failure({ formError: "Forbidden." });
  }
  const parsed = lookupUpdateSchema.safeParse({
    id: formData.get("id"),
    label: formData.get("label"),
    sortOrder: formData.get("sortOrder"),
    isActive: formData.get("isActive") as string | null,
    description: formData.get("description") || undefined,
  });
  if (!parsed.success) {
    return failure({ fieldErrors: zodErrorToFieldErrors(parsed.error) });
  }
  const before = await prisma.lookupEntry.findFirst({
    where: { id: parsed.data.id, ...notDeleted },
  });
  if (!before) return failure({ formError: "Lookup not found." });
  const isActive = parsed.data.isActive === "on";
  const descRaw = parsed.data.description?.trim();
  const description = descRaw === "" || descRaw === undefined ? null : descRaw;
  const label = parsed.data.label.trim();
  await prisma.lookupEntry.update({
    where: { id: parsed.data.id },
    data: {
      label,
      sortOrder: parsed.data.sortOrder,
      isActive,
      description,
    },
  });
  await writeAuditLog({
    userId: session.user.id,
    entityType: AuditEntityType.LookupEntry,
    entityId: parsed.data.id,
    action: AuditAction.LOOKUP_UPDATE,
    diff: {
      domain: before.domain,
      code: before.code,
      label: { from: before.label, to: label },
      sortOrder: { from: before.sortOrder, to: parsed.data.sortOrder },
      isActive: { from: before.isActive, to: isActive },
    },
  });
  revalidateReferencePaths();
  return success();
}

export async function deleteLookupEntryAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return failure({ formError: "Sign in required." });
  try {
    assertAnyRole(session.user.roles, LAB_ROLES_ADMIN_ONLY);
  } catch {
    return failure({ formError: "Forbidden." });
  }
  const parsed = idSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) {
    return failure({ fieldErrors: zodErrorToFieldErrors(parsed.error) });
  }
  const row = await prisma.lookupEntry.findFirst({
    where: { id: parsed.data.id, ...notDeleted },
  });
  if (!row) return failure({ formError: "Lookup not found." });
  if (row.isSystem) {
    return failure({ formError: "System lookup values cannot be deleted." });
  }
  const n =
    row.domain === "ASSET_CONDITION"
      ? await prisma.asset.count({
          where: { conditionCode: row.code, ...notDeleted },
        })
      : await prisma.asset.count({
          where: { operationalStatusCode: row.code, ...notDeleted },
        });
  if (n > 0) {
    return failure({
      formError: `Cannot delete: ${n} asset(s) use this code. Deactivate it instead.`,
    });
  }
  const archivedCode = appendArchivedSuffix(row.code, row.id, 64);
  await prisma.lookupEntry.update({
    where: { id: parsed.data.id },
    data: {
      deletedAt: new Date(),
      isActive: false,
      code: archivedCode,
    },
  });
  await writeAuditLog({
    userId: session.user.id,
    entityType: AuditEntityType.LookupEntry,
    entityId: parsed.data.id,
    action: AuditAction.LOOKUP_DELETE,
    diff: { domain: row.domain, code: row.code, label: row.label },
  });
  revalidateReferencePaths();
  return success();
}
