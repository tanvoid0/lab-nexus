import Link from "next/link";
import { auth } from "@/auth";
import { hasRole, LAB_ROLE } from "@/lib/auth/roles";
import { prisma } from "@/lib/db";
import { notDeleted } from "@/lib/prisma/active-scopes";
import { redirect } from "next/navigation";
import { ReferenceDataClient } from "@/components/admin/reference-data";
import type { ReferenceLookupEntry } from "@/lib/types/reference-lookup";
import { Button } from "@/components/ui/button";

export default async function AdminReferenceDataPage() {
  const session = await auth();
  if (!hasRole(session?.user?.roles ?? [], LAB_ROLE.ADMIN)) {
    redirect("/inventory");
  }

  const [categories, locations, conditionLookups, operationalLookups] = await Promise.all([
    prisma.assetCategory.findMany({ where: { ...notDeleted }, orderBy: { name: "asc" } }),
    prisma.location.findMany({ where: { ...notDeleted }, orderBy: { name: "asc" } }),
    prisma.lookupEntry.findMany({
      where: { domain: "ASSET_CONDITION", ...notDeleted },
      orderBy: [{ sortOrder: "asc" }, { code: "asc" }],
    }),
    prisma.lookupEntry.findMany({
      where: { domain: "ASSET_OPERATIONAL_STATUS", ...notDeleted },
      orderBy: [{ sortOrder: "asc" }, { code: "asc" }],
    }),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Button asChild variant="ghost" size="sm" className="-ml-2 mb-1 h-auto px-2 py-1 text-muted-foreground">
            <Link href="/admin">← Admin</Link>
          </Button>
          <h1 className="text-2xl font-semibold text-primary">Reference data</h1>
          <p className="text-sm text-muted-foreground">
            Categories, locations, asset condition labels, and operational status labels. Checkout
            workflow statuses (active / returned / overdue) stay system-controlled.
          </p>
        </div>
      </div>

      <ReferenceDataClient
        categories={categories}
        locations={locations}
        conditionLookups={conditionLookups as ReferenceLookupEntry[]}
        operationalLookups={operationalLookups as ReferenceLookupEntry[]}
      />
    </div>
  );
}
