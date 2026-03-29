import { auth } from "@/auth";
import { hasAnyRole, LAB_ROLES_STAFF } from "@/lib/auth/roles";
import { prisma } from "@/lib/db";
import { notDeleted } from "@/lib/prisma/active-scopes";
import { redirect, notFound } from "next/navigation";
import { BreadcrumbDetailFromTitle } from "@/components/layout/breadcrumb-detail-from-title";
import { AssetForm } from "@/components/inventory/asset-form";
import { listActiveLookupsByDomain } from "@/lib/reference/lookup-label-maps";
import type { NextPageProps } from "@/lib/types/next-app";

export default async function EditAssetPage({
  params,
}: NextPageProps<{ id: string }>) {
  const session = await auth();
  if (!hasAnyRole(session?.user?.roles, LAB_ROLES_STAFF)) {
    redirect("/inventory");
  }
  const { id } = await params;
  const asset = await prisma.asset.findFirst({ where: { id, ...notDeleted } });
  if (!asset) notFound();

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
      <BreadcrumbDetailFromTitle title={asset.name} />
      <AssetForm
        mode="edit"
        asset={asset}
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
