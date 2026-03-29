import { auth } from "@/auth";
import { hasAnyRole, LAB_ROLES_STAFF } from "@/lib/auth/roles";
import { escapeCsvCell } from "@/lib/csv";
import { auditActionLabel, auditEntityLabel, auditFlowForEntityType } from "@/lib/audit/labels";
import { buildAuditWhere, parseAuditFilterState } from "@/lib/audit/query";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

const MAX_ROWS = 50_000;

function searchParamsToRecord(sp: URLSearchParams): Record<string, string | undefined> {
  const out: Record<string, string | undefined> = {};
  sp.forEach((value, key) => {
    out[key] = value;
  });
  return out;
}

/** CSV export of audit log rows (ADMIN / RESEARCHER), honoring the same filters as /admin/audit. */
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id || !hasAnyRole(session.user.roles, LAB_ROLES_STAFF)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const state = parseAuditFilterState(searchParamsToRecord(url.searchParams));
  const where = buildAuditWhere(state);

  const rows = await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: MAX_ROWS,
    include: { user: { select: { email: true, name: true } } },
  });

  const header = [
    "createdAt",
    "flow",
    "entityType",
    "entityTypeLabel",
    "action",
    "actionLabel",
    "actorUserId",
    "actorEmail",
    "actorName",
    "entityId",
    "diffJson",
  ].join(",");

  const lines = rows.map((r) =>
    [
      escapeCsvCell(r.createdAt.toISOString()),
      escapeCsvCell(auditFlowForEntityType(r.entityType)),
      escapeCsvCell(r.entityType),
      escapeCsvCell(auditEntityLabel(r.entityType)),
      escapeCsvCell(r.action),
      escapeCsvCell(auditActionLabel(r.action)),
      escapeCsvCell(r.userId ?? ""),
      escapeCsvCell(r.user?.email ?? ""),
      escapeCsvCell(r.user?.name ?? ""),
      escapeCsvCell(r.entityId),
      escapeCsvCell(r.diff == null ? "" : JSON.stringify(r.diff)),
    ].join(","),
  );

  const body = [header, ...lines].join("\n");
  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="lab-nexus-audit-log.csv"',
    },
  });
}
