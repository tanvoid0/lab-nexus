import Link from "next/link";
import { prisma } from "@/lib/db";
import { notDeleted } from "@/lib/prisma/active-scopes";
import { toAssetListItem } from "@/lib/mappers/asset";
import { hasAnyRole, LAB_ROLES, LAB_ROLES_STAFF } from "@/lib/auth/roles";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NATIVE_SELECT_CLASSES } from "@/lib/form/native-field-classes";
import { InventoryNewAssetLink } from "@/components/inventory/inventory-new-asset-link";
import { InventoryEmptyPanel } from "@/components/inventory/inventory-empty-panel";
import { InventoryAssetTable } from "@/components/inventory/inventory-asset-table";
import {
  listActiveLookupsByDomain,
  loadLookupLabelMaps,
} from "@/lib/reference/lookup-label-maps";
import type { AssetCategory, Location, Project } from "@prisma/client";

type SearchParams = Promise<{
  q?: string;
  categoryId?: string;
  locationId?: string;
  projectId?: string;
  condition?: string;
  status?: string;
}>;

export default async function InventoryPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await auth();
  const sp = await searchParams;
  const q = sp.q?.trim();
  const canEdit = hasAnyRole(session?.user?.roles, LAB_ROLES_STAFF);
  const canUseCart = hasAnyRole(session?.user?.roles, LAB_ROLES);

  const where = {
    AND: [
      { ...notDeleted },
      q
        ? {
            OR: [
              { name: { contains: q } },
              { skuOrInternalId: { contains: q } },
              { trackTag: { contains: q } },
            ],
          }
        : {},
      sp.categoryId ? { categoryId: sp.categoryId } : {},
      sp.locationId ? { locationId: sp.locationId } : {},
      sp.projectId ? { projectId: sp.projectId } : {},
      sp.condition ? { conditionCode: sp.condition } : {},
      sp.status ? { operationalStatusCode: sp.status } : {},
    ],
  };

  const [
    assets,
    categories,
    locations,
    projects,
    totalAssetCount,
    conditionOptions,
    operationalOptions,
    labelMaps,
  ] = await Promise.all([
    prisma.asset.findMany({
      where,
      include: {
        category: true,
        location: true,
        project: true,
        _count: { select: { units: { where: { ...notDeleted } } } },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.assetCategory.findMany({ where: { ...notDeleted }, orderBy: { name: "asc" } }),
    prisma.location.findMany({ where: { ...notDeleted }, orderBy: { name: "asc" } }),
    prisma.project.findMany({
      where: { ...notDeleted },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.asset.count({ where: { ...notDeleted } }),
    listActiveLookupsByDomain(prisma, "ASSET_CONDITION"),
    listActiveLookupsByDomain(prisma, "ASSET_OPERATIONAL_STATUS"),
    loadLookupLabelMaps(prisma),
  ]);

  const rows = await Promise.all(assets.map((a) => toAssetListItem(a)));
  const emptyCatalog = rows.length === 0 && totalAssetCount === 0;
  const noRows = rows.length === 0;
  const conditionLabels = Object.fromEntries(labelMaps.conditionLabelByCode);
  const operationalLabels = Object.fromEntries(
    labelMaps.operationalStatusLabelByCode,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-primary">Inventory</h1>
          <p className="text-sm text-muted-foreground">
            Browse lab assets, availability, and details.
          </p>
        </div>
        {canEdit ? <InventoryNewAssetLink /> : null}
      </div>

      <form
        method="get"
        className="grid gap-3 rounded-lg border border-border bg-card p-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8"
      >
        <Input
          name="q"
          placeholder="Search name, SKU, or track tag…"
          defaultValue={q}
          className="bg-background md:col-span-2 xl:col-span-2"
        />
        <select
          name="categoryId"
          defaultValue={sp.categoryId ?? ""}
          className={NATIVE_SELECT_CLASSES}
        >
          <option value="">All categories</option>
          {categories.map((c: AssetCategory) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          name="locationId"
          defaultValue={sp.locationId ?? ""}
          className={NATIVE_SELECT_CLASSES}
        >
          <option value="">All locations</option>
          {locations.map((l: Location) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
        <select
          name="projectId"
          defaultValue={sp.projectId ?? ""}
          className={NATIVE_SELECT_CLASSES}
        >
          <option value="">All projects</option>
          {projects.map((p: Pick<Project, "id" | "name">) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <select
          name="condition"
          defaultValue={sp.condition ?? ""}
          className={NATIVE_SELECT_CLASSES}
        >
          <option value="">Any condition</option>
          {conditionOptions.map((c: { code: string; label: string }) => (
            <option key={c.code} value={c.code}>
              {c.label}
            </option>
          ))}
        </select>
        <select
          name="status"
          defaultValue={sp.status ?? ""}
          className={NATIVE_SELECT_CLASSES}
        >
          <option value="">Any status</option>
          {operationalOptions.map((s: { code: string; label: string }) => (
            <option key={s.code} value={s.code}>
              {s.label}
            </option>
          ))}
        </select>
        <div className="flex flex-col gap-2 sm:flex-row md:col-span-2 xl:col-span-8">
          <Button type="submit" variant="secondary" className="min-h-11 w-full sm:min-h-9 sm:w-auto">
            Apply filters
          </Button>
          <Button type="button" variant="ghost" asChild className="min-h-11 w-full sm:min-h-9 sm:w-auto">
            <Link href="/inventory">Clear</Link>
          </Button>
        </div>
      </form>

      {noRows ? (
        <InventoryEmptyPanel variant={emptyCatalog ? "catalog" : "filtered"} canEdit={canEdit} />
      ) : (
        <InventoryAssetTable
          rows={rows}
          conditionLabels={conditionLabels}
          operationalLabels={operationalLabels}
          canUseCart={canUseCart}
        />
      )}
    </div>
  );
}
