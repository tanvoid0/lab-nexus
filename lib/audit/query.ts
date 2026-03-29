import {
  AuditEntityType,
  type AuditAction,
  type Prisma,
} from "@prisma/client";
import {
  AUDIT_ACTIONS,
  AUDIT_ENTITY_TYPES,
  AUDIT_PAGE_SIZES,
} from "@/lib/audit/constants";

const OBJECT_ID_RE = /^[a-f0-9]{24}$/i;

export type AuditFilterState = {
  userId: string;
  entityType: "" | AuditEntityType;
  action: "" | AuditAction;
  entityId: string;
  from: string;
  to: string;
  actor: "all" | "human" | "system";
  flow:
    | ""
    | "Inventory"
    | "Lending"
    | "Projects"
    | "Import"
    | "Reference data"
    | "Accounts";
  page: number;
  pageSize: number;
};

function isAuditEntityType(s: string): s is AuditEntityType {
  return (AUDIT_ENTITY_TYPES as readonly string[]).includes(s);
}

function isAuditAction(s: string): s is AuditAction {
  return (AUDIT_ACTIONS as readonly string[]).includes(s);
}

function firstString(v: string | string[] | undefined): string | undefined {
  if (v === undefined) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

export function parseAuditFilterState(
  input: Record<string, string | string[] | undefined>,
): AuditFilterState {
  const userId = firstString(input.user)?.trim() ?? "";
  const entityRaw = firstString(input.entity)?.trim() ?? "";
  const entityType =
    entityRaw && isAuditEntityType(entityRaw)
      ? entityRaw
      : ("" as const);

  const actionRaw = firstString(input.action)?.trim() ?? "";
  const action =
    actionRaw && isAuditAction(actionRaw) ? actionRaw : ("" as const);

  const entityId = firstString(input.entityId)?.trim() ?? "";
  const from = firstString(input.from)?.trim() ?? "";
  const to = firstString(input.to)?.trim() ?? "";

  const actorRaw = firstString(input.actor)?.trim();
  const actor =
    actorRaw === "human" || actorRaw === "system" ? actorRaw : "all";

  const flowRaw = firstString(input.flow)?.trim() ?? "";
  const flow =
    flowRaw === "Inventory" ||
    flowRaw === "Lending" ||
    flowRaw === "Projects" ||
    flowRaw === "Import" ||
    flowRaw === "Reference data" ||
    flowRaw === "Accounts"
      ? flowRaw
      : ("" as const);

  const pageRaw = firstString(input.page);
  const page = Math.max(1, Number.parseInt(pageRaw ?? "1", 10) || 1);

  const pageSizeRaw = firstString(input.pageSize);
  const parsedSize = Number.parseInt(pageSizeRaw ?? "", 10);
  const pageSize = AUDIT_PAGE_SIZES.includes(parsedSize as (typeof AUDIT_PAGE_SIZES)[number])
    ? parsedSize
    : 50;

  return {
    userId,
    entityType,
    action,
    entityId,
    from,
    to,
    actor,
    flow,
    page,
    pageSize,
  };
}

function flowToEntityTypes(
  flow: AuditFilterState["flow"],
): Prisma.AuditLogWhereInput | undefined {
  if (!flow) return undefined;
  switch (flow) {
    case "Inventory":
      return { entityType: AuditEntityType.Asset };
    case "Lending":
      return { entityType: AuditEntityType.Checkout };
    case "Projects":
      return { entityType: AuditEntityType.Project };
    case "Import":
      return { entityType: AuditEntityType.Import };
    case "Reference data":
      return {
        entityType: {
          in: [AuditEntityType.AssetCategory, AuditEntityType.Location],
        },
      };
    case "Accounts":
      return { entityType: AuditEntityType.User };
    default:
      return undefined;
  }
}

export function buildAuditWhere(
  state: AuditFilterState,
): Prisma.AuditLogWhereInput {
  const and: Prisma.AuditLogWhereInput[] = [];

  if (state.userId && OBJECT_ID_RE.test(state.userId)) {
    and.push({ userId: state.userId });
  }

  if (state.entityType) {
    and.push({ entityType: state.entityType });
  } else {
    const flowClause = flowToEntityTypes(state.flow);
    if (flowClause) {
      and.push(flowClause);
    }
  }

  if (state.action) {
    and.push({ action: state.action });
  }

  if (state.entityId) {
    if (OBJECT_ID_RE.test(state.entityId)) {
      and.push({ entityId: state.entityId });
    } else {
      and.push({ entityId: { contains: state.entityId, mode: "insensitive" } });
    }
  }

  const createdAt: { gte?: Date; lte?: Date } = {};
  if (state.from) {
    const d = new Date(state.from);
    if (!Number.isNaN(d.getTime())) {
      d.setUTCHours(0, 0, 0, 0);
      createdAt.gte = d;
    }
  }
  if (state.to) {
    const d = new Date(state.to);
    if (!Number.isNaN(d.getTime())) {
      d.setUTCHours(23, 59, 59, 999);
      createdAt.lte = d;
    }
  }
  if (createdAt.gte !== undefined || createdAt.lte !== undefined) {
    and.push({ createdAt });
  }

  if (state.actor === "human") {
    and.push({ userId: { not: null } });
  } else if (state.actor === "system") {
    and.push({ userId: null });
  }

  if (and.length === 0) return {};
  return { AND: and };
}

export function auditQueryString(state: AuditFilterState): string {
  const p = new URLSearchParams();
  if (state.userId) p.set("user", state.userId);
  if (state.entityType) p.set("entity", state.entityType);
  if (state.action) p.set("action", state.action);
  if (state.entityId) p.set("entityId", state.entityId);
  if (state.from) p.set("from", state.from);
  if (state.to) p.set("to", state.to);
  if (state.actor !== "all") p.set("actor", state.actor);
  if (state.flow) p.set("flow", state.flow);
  if (state.page > 1) p.set("page", String(state.page));
  if (state.pageSize !== 50) p.set("pageSize", String(state.pageSize));
  const s = p.toString();
  return s ? `?${s}` : "";
}
