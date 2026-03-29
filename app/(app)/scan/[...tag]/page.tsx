import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { notDeleted } from "@/lib/prisma/active-scopes";
import {
  decodedScanPayloadFromPathSegments,
  resolveInventoryTrackTagScan,
} from "@/lib/scan";
import {
  assetDetailPath,
  INVENTORY_LIST_PATH,
} from "@/lib/nav/inventory-paths";
import type { NextPageProps } from "@/lib/types/next-app";

export default async function ScanTagPage({
  params,
}: NextPageProps<{ tag: string[] }>) {
  const { tag: segments } = await params;
  if (!segments?.length) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-center sm:p-8">
        <h1 className="text-lg font-semibold text-primary sm:text-xl">Missing tag</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Add a tag to the URL after <code className="rounded bg-muted px-1.5 py-0.5 text-xs">/scan/</code>
          , or open an item from inventory and use{" "}
          <span className="font-medium text-foreground">Open scan link</span>.
        </p>
        <p className="mt-4">
          <Link
            href={INVENTORY_LIST_PATH}
            className="inline-flex min-h-11 min-w-[min(100%,12rem)] items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 sm:min-h-9"
          >
            Back to inventory
          </Link>
        </p>
      </div>
    );
  }

  const decodedTag = decodedScanPayloadFromPathSegments(segments);
  const resolution = await resolveInventoryTrackTagScan(prisma, decodedTag);

  if (resolution.kind === "ok") {
    redirect(
      assetDetailPath(resolution.assetId, {
        unit: resolution.unitId ?? null,
      }),
    );
  }

  if (resolution.kind === "ambiguous") {
    const assets = await prisma.asset.findMany({
      where: { id: { in: resolution.assetIds }, ...notDeleted },
      select: { id: true, name: true, skuOrInternalId: true },
      orderBy: { name: "asc" },
    });

    return (
      <div className="rounded-lg border border-border bg-card p-6 text-center sm:p-8">
        <h1 className="text-lg font-semibold text-primary sm:text-xl">Tag matches more than one item</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          The tag{" "}
          <code className="break-all rounded bg-muted px-1.5 py-0.5 text-xs sm:text-sm">
            {resolution.tag}
          </code>{" "}
          is assigned to multiple catalog rows. Use a unique track tag per sticker, then pick the correct
          asset below.
        </p>
        <ul className="mx-auto mt-6 max-w-md space-y-2 text-left text-sm">
          {assets.map((a) => (
            <li key={a.id}>
              <Link
                href={assetDetailPath(a.id)}
                className="block rounded-md border border-border px-3 py-2 font-medium text-primary hover:bg-muted/60"
              >
                {a.name}
                <span className="mt-0.5 block font-mono text-xs font-normal text-muted-foreground">
                  {a.skuOrInternalId}
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-6">
          <Link
            href={INVENTORY_LIST_PATH}
            className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Back to inventory
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-6 text-center sm:p-8">
      <h1 className="text-lg font-semibold text-primary sm:text-xl">Unknown tag</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        No asset is registered for{" "}
        <code className="break-all rounded bg-muted px-1.5 py-0.5 text-xs sm:text-sm">
          {decodedTag}
        </code>
        .
      </p>
      <p className="mt-4">
        <Link
          href={INVENTORY_LIST_PATH}
          className="inline-flex min-h-11 min-w-[min(100%,12rem)] items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 sm:min-h-9"
        >
          Back to inventory
        </Link>
      </p>
    </div>
  );
}
