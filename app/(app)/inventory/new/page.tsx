import { auth } from "@/auth";
import { hasAnyRole, LAB_ROLES_STAFF } from "@/lib/auth/roles";
import { prisma } from "@/lib/db";
import { notDeleted } from "@/lib/prisma/active-scopes";
import { redirect } from "next/navigation";
import { AssetForm } from "@/components/inventory/asset-form";
import { listActiveLookupsByDomain } from "@/lib/reference/lookup-label-maps";

export default async function NewAssetPage() {
  const session = await auth();
  if (!hasAnyRole(session?.user?.roles, LAB_ROLES_STAFF)) {
    redirect("/inventory");
  }

  const [categories, locations, projects, users, conditionLookups, operationalStatusLookups] =
    await Promise.all([
      prisma.assetCategory.findMany({ where: { ...notDeleted }, orderBy: { name: "asc" } }),
      prisma.location.findMany({ where: { ...notDeleted }, orderBy: { name: "asc" } }),
      prisma.project.findMany({
        where: { ...notDeleted },
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      }),
      prisma.user.findMany({
        where: { ...notDeleted },
        select: { id: true, name: true, email: true },
        orderBy: { email: "asc" },
      }),
      listActiveLookupsByDomain(prisma, "ASSET_CONDITION"),
      listActiveLookupsByDomain(prisma, "ASSET_OPERATIONAL_STATUS"),
    ]);

  return (
    <div>
      <AssetForm
        mode="create"
        categories={categories}
        locations={locations}
        projects={projects}
        users={users}
        conditionLookups={conditionLookups.map((c) => ({ code: c.code, label: c.label }))}
        operationalStatusLookups={operationalStatusLookups.map((c) => ({
          code: c.code,
          label: c.label,
        }))}
      />
    </div>
  );
}
