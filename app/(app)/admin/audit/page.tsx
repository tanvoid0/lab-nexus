import Link from "next/link";
import { auth } from "@/auth";
import { hasAnyRole, LAB_ROLES_STAFF } from "@/lib/auth/roles";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { AuditTrailFilters, AuditTrailTable } from "@/components/admin/audit-trail";
import { buildAuditWhere, parseAuditFilterState } from "@/lib/audit/query";
import { Button } from "@/components/ui/button";

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  if (!hasAnyRole(session!.user!.roles ?? [], LAB_ROLES_STAFF)) {
    redirect("/inventory");
  }

  const sp = await searchParams;
  const state = parseAuditFilterState(sp);
  const where = buildAuditWhere(state);

  const total = await prisma.auditLog.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / state.pageSize));
  const page = Math.min(state.page, totalPages);

  const [entries, users] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * state.pageSize,
      take: state.pageSize,
      include: { user: { select: { name: true, email: true } } },
    }),
    prisma.user.findMany({
      select: { id: true, email: true, name: true, deletedAt: true },
      orderBy: { email: "asc" },
      take: 500,
    }),
  ]);

  const viewState = { ...state, page };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-primary">Audit trail</h1>
          <p className="text-sm text-muted-foreground">
            Searchable history of inventory, checkouts, projects, imports, and reference data
            changes.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin">Back to admin</Link>
        </Button>
      </div>

      <AuditTrailFilters users={users} state={state} />
      <AuditTrailTable entries={entries} state={viewState} total={total} />
    </div>
  );
}
