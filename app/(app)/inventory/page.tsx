import Link from "next/link";
import { prisma } from "@/lib/db";
import { toAssetListItem } from "@/lib/mappers/asset";
import { hasAnyRole } from "@/lib/auth/roles";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { InventoryNewAssetLink } from "@/components/inventory/inventory-new-asset-link";
import { ConditionBadge, OperationalBadge } from "@/components/inventory/asset-status-badge";
import type { AssetCondition, AssetOperationalStatus } from "@prisma/client";

type SearchParams = Promise<{
  q?: string;
  categoryId?: string;
  locationId?: string;
  condition?: string;
  status?: string;
}>;

export default async function InventoryPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await auth();
  const sp = await searchParams;
  const q = sp.q?.trim();
  const canEdit = hasAnyRole(session?.user?.roles, ["ADMIN", "RESEARCHER"]);

  const where = {
    AND: [
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
      sp.condition ? { condition: sp.condition as AssetCondition } : {},
      sp.status ? { operationalStatus: sp.status as AssetOperationalStatus } : {},
    ],
  };

  const [assets, categories, locations] = await Promise.all([
    prisma.asset.findMany({
      where,
      include: { category: true, location: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.assetCategory.findMany({ orderBy: { name: "asc" } }),
    prisma.location.findMany({ orderBy: { name: "asc" } }),
  ]);

  const rows = assets.map(toAssetListItem);

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
        className="grid gap-3 rounded-lg border border-border bg-card p-4 md:grid-cols-2 lg:grid-cols-6"
      >
        <input
          name="q"
          placeholder="Search name, SKU, or track tag…"
          defaultValue={q}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm lg:col-span-2"
        />
        <select
          name="categoryId"
          defaultValue={sp.categoryId ?? ""}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          name="locationId"
          defaultValue={sp.locationId ?? ""}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">All locations</option>
          {locations.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
        <select
          name="condition"
          defaultValue={sp.condition ?? ""}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">Any condition</option>
          {(["WORKING", "BROKEN", "IN_REPAIR", "UNKNOWN"] as const).map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          name="status"
          defaultValue={sp.status ?? ""}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">Any status</option>
          {(["AVAILABLE", "MAINTENANCE", "RETIRED"] as const).map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <div className="flex gap-2 md:col-span-2 lg:col-span-6">
          <Button type="submit" variant="secondary">
            Apply filters
          </Button>
          <Button type="button" variant="ghost" asChild>
            <Link href="/inventory">Clear</Link>
          </Button>
        </div>
      </form>

      {rows.length === 0 ? (
        <p className="text-muted-foreground">No assets match your filters.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                <th className="p-3 font-medium">SKU / ID</th>
                <th className="p-3 font-medium">Name</th>
                <th className="p-3 font-medium">Category</th>
                <th className="p-3 font-medium">Location</th>
                <th className="p-3 font-medium">Qty</th>
                <th className="p-3 font-medium">Condition</th>
                <th className="p-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="p-3">
                    <Link
                      href={`/inventory/${a.id}`}
                      className="font-mono text-primary underline-offset-4 hover:underline"
                    >
                      {a.skuOrInternalId}
                    </Link>
                  </td>
                  <td className="p-3">{a.name}</td>
                  <td className="p-3 text-muted-foreground">{a.categoryName ?? "—"}</td>
                  <td className="p-3 text-muted-foreground">{a.locationName ?? "—"}</td>
                  <td className="p-3">
                    {a.quantityAvailable}/{a.quantityTotal}
                  </td>
                  <td className="p-3">
                    <ConditionBadge value={a.condition} />
                  </td>
                  <td className="p-3">
                    <OperationalBadge value={a.operationalStatus} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
