import {
  FunctionCallingMode,
  SchemaType,
  type FunctionDeclaration,
} from "@google/generative-ai";
import { z } from "zod";
import type { ToolContext } from "@/lib/ai/tool-context";
import { prisma } from "@/lib/db";
import { hasRole, LAB_ROLE } from "@/lib/auth/roles";
import { notDeleted } from "@/lib/prisma/active-scopes";
import { resolveTrackTagScan } from "@/lib/inventory/resolve-track-tag-scan";
import {
  AuditEntityType,
  CheckoutStatus,
  LookupDomain,
} from "@prisma/client";

const searchInventorySchema = z.object({
  query: z.string().min(1).max(200),
  limit: z.coerce.number().int().min(1).max(20).optional().default(10),
});

const resolveTrackTagSchema = z.object({
  trackTag: z.string().min(1).max(500),
});

const listMyCheckoutsSchema = z.object({
  status: z.nativeEnum(CheckoutStatus).optional(),
});

const listReferenceSchema = z.object({
  kind: z.enum([
    "categories",
    "locations",
    "condition_codes",
    "operational_status_codes",
  ]),
});

const auditEntityTypeZod = z.nativeEnum(AuditEntityType);

const recentAuditSchema = z.object({
  entityType: auditEntityTypeZod,
  entityId: z.string().min(1).max(64),
  limit: z.coerce.number().int().min(1).max(25).optional().default(10),
});

export const toolDeclarationsStaff: FunctionDeclaration[] = [
  {
    name: "search_inventory",
    description:
      "Search active (non-archived) inventory by name, SKU/internal id, or track tag. Returns a short list of matching assets with location, category, and availability.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        query: {
          type: SchemaType.STRING,
          description: "Search text (substring match, case-insensitive).",
        },
        limit: {
          type: SchemaType.INTEGER,
          description: "Max rows to return (1–20). Default 10.",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "resolve_track_tag",
    description:
      "Resolve an asset or unit track tag to the catalog asset. Returns asset summary or explains if not found or ambiguous.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        trackTag: {
          type: SchemaType.STRING,
          description: "Physical track tag / QR payload string.",
        },
      },
      required: ["trackTag"],
    },
  },
  {
    name: "list_my_checkouts",
    description:
      "List loans for the currently signed-in user. Optional filter by checkout workflow status (ACTIVE, RETURNED, OVERDUE).",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        status: {
          type: SchemaType.STRING,
          description:
            "Optional: ACTIVE, RETURNED, or OVERDUE. Omit to include all statuses.",
        },
      },
    },
  },
  {
    name: "list_reference_labels",
    description:
      "Read-only snapshot of reference lists: asset categories, locations, or lookup codes/labels for condition and operational status.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        kind: {
          type: SchemaType.STRING,
          description:
            "One of: categories, locations, condition_codes, operational_status_codes.",
        },
      },
      required: ["kind"],
    },
  },
];

export const toolDeclarationAdminAudit: FunctionDeclaration = {
  name: "recent_audit_for_entity",
  description:
    "Admin only. Recent audit log entries for a specific entity type and id (e.g. Asset, Checkout).",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      entityType: {
        type: SchemaType.STRING,
        description:
          "AuditEntityType: Asset, Checkout, CheckoutRequest, Project, Import, AssetCategory, Location, LookupEntry, User.",
      },
      entityId: {
        type: SchemaType.STRING,
        description: "Mongo ObjectId string of the entity.",
      },
      limit: {
        type: SchemaType.INTEGER,
        description: "Max entries (1–25). Default 10.",
      },
    },
    required: ["entityType", "entityId"],
  },
};

export function geminiToolConfig() {
  return {
    functionCallingConfig: { mode: FunctionCallingMode.AUTO },
  } as const;
}

export function functionDeclarationsForRoles(roles: string[]): FunctionDeclaration[] {
  const base = [...toolDeclarationsStaff];
  if (hasRole(roles, LAB_ROLE.ADMIN)) {
    base.push(toolDeclarationAdminAudit);
  }
  return base;
}

async function runSearchInventory(raw: unknown) {
  const parsed = searchInventorySchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false as const, error: "Invalid arguments for search_inventory." };
  }
  const { query, limit } = parsed.data;
  const rows = await prisma.asset.findMany({
    where: {
      ...notDeleted,
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { skuOrInternalId: { contains: query, mode: "insensitive" } },
        { trackTag: { contains: query, mode: "insensitive" } },
      ],
    },
    take: limit,
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      skuOrInternalId: true,
      trackTag: true,
      quantityAvailable: true,
      quantityTotal: true,
      operationalStatusCode: true,
      conditionCode: true,
      category: { select: { name: true } },
      location: { select: { name: true } },
      project: { select: { name: true } },
    },
  });
  return {
    ok: true as const,
    count: rows.length,
    assets: rows.map((a) => ({
      id: a.id,
      name: a.name,
      skuOrInternalId: a.skuOrInternalId,
      trackTag: a.trackTag,
      quantityAvailable: a.quantityAvailable,
      quantityTotal: a.quantityTotal,
      operationalStatusCode: a.operationalStatusCode,
      conditionCode: a.conditionCode,
      category: a.category?.name ?? null,
      location: a.location?.name ?? null,
      project: a.project?.name ?? null,
    })),
  };
}

async function runResolveTrackTag(raw: unknown) {
  const parsed = resolveTrackTagSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false as const, error: "Invalid arguments for resolve_track_tag." };
  }
  const resolution = await resolveTrackTagScan(prisma, parsed.data.trackTag);
  if (resolution.kind === "none") {
    return {
      ok: true as const,
      resolved: false as const,
      message: `No active asset or unit matched tag: ${resolution.tag}`,
    };
  }
  if (resolution.kind === "ambiguous") {
    return {
      ok: true as const,
      resolved: false as const,
      message: "Multiple assets match this tag; ask the user to open Inventory and narrow by context.",
      assetIds: resolution.assetIds,
    };
  }
  const asset = await prisma.asset.findFirst({
    where: { id: resolution.assetId, ...notDeleted },
    select: {
      id: true,
      name: true,
      skuOrInternalId: true,
      trackTag: true,
      quantityAvailable: true,
      quantityTotal: true,
      operationalStatusCode: true,
      conditionCode: true,
      category: { select: { name: true } },
      location: { select: { name: true } },
      project: { select: { name: true } },
    },
  });
  if (!asset) {
    return {
      ok: true as const,
      resolved: false as const,
      message: "Tag mapped to an id but the asset is not active.",
    };
  }
  return {
    ok: true as const,
    resolved: true as const,
    asset: {
      id: asset.id,
      name: asset.name,
      skuOrInternalId: asset.skuOrInternalId,
      trackTag: asset.trackTag,
      quantityAvailable: asset.quantityAvailable,
      quantityTotal: asset.quantityTotal,
      operationalStatusCode: asset.operationalStatusCode,
      conditionCode: asset.conditionCode,
      category: asset.category?.name ?? null,
      location: asset.location?.name ?? null,
      project: asset.project?.name ?? null,
    },
  };
}

async function runListMyCheckouts(ctx: ToolContext, raw: unknown) {
  const parsed = listMyCheckoutsSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false as const, error: "Invalid arguments for list_my_checkouts." };
  }
  const where: { userId: string; status?: CheckoutStatus } = {
    userId: ctx.userId,
  };
  if (parsed.data.status) where.status = parsed.data.status;
  const rows = await prisma.checkout.findMany({
    where,
    take: 30,
    orderBy: { checkedOutAt: "desc" },
    select: {
      id: true,
      status: true,
      checkedOutAt: true,
      dueAt: true,
      returnedAt: true,
      purpose: true,
      asset: {
        select: { name: true, skuOrInternalId: true, trackTag: true },
      },
      project: { select: { name: true } },
    },
  });
  return {
    ok: true as const,
    count: rows.length,
    checkouts: rows.map((c) => ({
      id: c.id,
      status: c.status,
      checkedOutAt: c.checkedOutAt.toISOString(),
      dueAt: c.dueAt.toISOString(),
      returnedAt: c.returnedAt?.toISOString() ?? null,
      purpose: c.purpose,
      assetName: c.asset.name,
      assetSku: c.asset.skuOrInternalId,
      assetTrackTag: c.asset.trackTag,
      project: c.project?.name ?? null,
    })),
  };
}

async function runListReference(raw: unknown) {
  const parsed = listReferenceSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: "Invalid arguments for list_reference_labels.",
    };
  }
  switch (parsed.data.kind) {
    case "categories": {
      const rows = await prisma.assetCategory.findMany({
        where: notDeleted,
        orderBy: { name: "asc" },
        select: { name: true },
      });
      return { ok: true as const, kind: parsed.data.kind, names: rows.map((r) => r.name) };
    }
    case "locations": {
      const rows = await prisma.location.findMany({
        where: notDeleted,
        orderBy: { name: "asc" },
        select: { name: true },
      });
      return { ok: true as const, kind: parsed.data.kind, names: rows.map((r) => r.name) };
    }
    case "condition_codes": {
      const rows = await prisma.lookupEntry.findMany({
        where: {
          domain: LookupDomain.ASSET_CONDITION,
          isActive: true,
          ...notDeleted,
        },
        orderBy: [{ sortOrder: "asc" }, { code: "asc" }],
        select: { code: true, label: true },
      });
      return {
        ok: true as const,
        kind: parsed.data.kind,
        entries: rows.map((r) => ({ code: r.code, label: r.label })),
      };
    }
    case "operational_status_codes": {
      const rows = await prisma.lookupEntry.findMany({
        where: {
          domain: LookupDomain.ASSET_OPERATIONAL_STATUS,
          isActive: true,
          ...notDeleted,
        },
        orderBy: [{ sortOrder: "asc" }, { code: "asc" }],
        select: { code: true, label: true },
      });
      return {
        ok: true as const,
        kind: parsed.data.kind,
        entries: rows.map((r) => ({ code: r.code, label: r.label })),
      };
    }
    default:
      return { ok: false as const, error: "Unknown kind." };
  }
}

async function runRecentAudit(ctx: ToolContext, raw: unknown) {
  if (!hasRole(ctx.roles, LAB_ROLE.ADMIN)) {
    return { ok: false as const, error: "Not authorized for audit queries." };
  }
  const parsed = recentAuditSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: "Invalid arguments for recent_audit_for_entity.",
    };
  }
  const rows = await prisma.auditLog.findMany({
    where: {
      entityType: parsed.data.entityType,
      entityId: parsed.data.entityId,
    },
    take: parsed.data.limit,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      action: true,
      createdAt: true,
      userId: true,
      diff: true,
    },
  });
  return {
    ok: true as const,
    count: rows.length,
    events: rows.map((r) => ({
      id: r.id,
      action: r.action,
      createdAt: r.createdAt.toISOString(),
      actorUserId: r.userId,
      diff: r.diff,
    })),
  };
}

export async function executeRegisteredTool(
  name: string,
  args: object,
  ctx: ToolContext,
): Promise<object> {
  switch (name) {
    case "search_inventory":
      return runSearchInventory(args);
    case "resolve_track_tag":
      return runResolveTrackTag(args);
    case "list_my_checkouts":
      return runListMyCheckouts(ctx, args);
    case "list_reference_labels":
      return runListReference(args);
    case "recent_audit_for_entity":
      return runRecentAudit(ctx, args);
    default:
      return { ok: false, error: `Unknown tool: ${name}` };
  }
}
