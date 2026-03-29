import { auth } from "@/auth";
import { hasAnyRole, LAB_ROLES_STAFF } from "@/lib/auth/roles";
import { escapeCsvCell } from "@/lib/csv";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

/** CSV export of all checkout records (ADMIN / RESEARCHER). */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id || !hasAnyRole(session.user.roles, LAB_ROLES_STAFF)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await prisma.checkout.findMany({
    include: {
      asset: { select: { skuOrInternalId: true, name: true } },
      user: { select: { email: true, name: true } },
      project: { select: { name: true } },
      assetUnit: {
        select: { serialNumber: true, trackTag: true },
      },
    },
    orderBy: { checkedOutAt: "desc" },
  });

  const header = [
    "id",
    "status",
    "checkedOutAt",
    "dueAt",
    "returnedAt",
    "purpose",
    "assetSku",
    "assetName",
    "borrowerEmail",
    "borrowerName",
    "projectName",
    "unitSerial",
    "unitTrackTag",
  ].join(",");

  const lines = rows.map((c) =>
    [
      c.id,
      c.status,
      c.checkedOutAt.toISOString(),
      c.dueAt.toISOString(),
      c.returnedAt?.toISOString() ?? "",
      escapeCsvCell(c.purpose ?? ""),
      escapeCsvCell(c.asset.skuOrInternalId),
      escapeCsvCell(c.asset.name),
      escapeCsvCell(c.user?.email ?? ""),
      escapeCsvCell(c.user?.name ?? ""),
      escapeCsvCell(c.project?.name ?? ""),
      escapeCsvCell(c.assetUnit?.serialNumber ?? ""),
      escapeCsvCell(c.assetUnit?.trackTag ?? ""),
    ].join(","),
  );

  const body = [header, ...lines].join("\n");
  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="lab-nexus-checkouts.csv"',
    },
  });
}
