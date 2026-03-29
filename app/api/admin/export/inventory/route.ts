import { auth } from "@/auth";
import { hasAnyRole, LAB_ROLES_STAFF } from "@/lib/auth/roles";
import { escapeCsvCell } from "@/lib/csv";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

/** CSV export of assets for planning (ADMIN / RESEARCHER). */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id || !hasAnyRole(session.user.roles, LAB_ROLES_STAFF)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await prisma.asset.findMany({
    where: { deletedAt: null },
    include: { category: true, location: true, project: true },
    orderBy: { skuOrInternalId: "asc" },
  });

  const header = [
    "skuOrInternalId",
    "name",
    "category",
    "location",
    "project",
    "conditionCode",
    "operationalStatusCode",
    "quantityTotal",
    "quantityAvailable",
    "acquiredAt",
    "trackTag",
  ].join(",");

  const lines = rows.map((a) =>
    [
      escapeCsvCell(a.skuOrInternalId),
      escapeCsvCell(a.name),
      escapeCsvCell(a.category?.name ?? ""),
      escapeCsvCell(a.location?.name ?? ""),
      escapeCsvCell(a.project?.name ?? ""),
      a.conditionCode,
      a.operationalStatusCode,
      a.quantityTotal,
      a.quantityAvailable,
      a.acquiredAt?.toISOString() ?? "",
      escapeCsvCell(a.trackTag ?? ""),
    ].join(","),
  );

  const body = [header, ...lines].join("\n");
  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="lab-nexus-inventory.csv"',
    },
  });
}
