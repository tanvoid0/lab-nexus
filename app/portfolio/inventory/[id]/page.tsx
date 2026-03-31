import Link from "next/link";
import { notFound } from "next/navigation";
import { ConditionBadge, OperationalBadge } from "@/components/inventory/asset-status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/db";
import { getPublicAssetDetail } from "@/lib/portfolio/public-showcase";
import { loadLookupLabelMaps } from "@/lib/reference/lookup-label-maps";
import type { NextPageProps } from "@/lib/types/next-app";
import { AssetImage } from "@/components/inventory/asset-image";

export default async function PublicInventoryDetailPage({
  params,
}: NextPageProps<{ id: string }>) {
  const { id } = await params;
  const [asset, labelMaps] = await Promise.all([
    getPublicAssetDetail(id),
    loadLookupLabelMaps(prisma),
  ]);

  if (!asset) notFound();

  return (
    <div className="mx-auto flex w-full max-w-[90rem] flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8 2xl:max-w-[104rem]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2 h-auto px-2 py-1">
            <Link href="/#inventory">Back to portfolio</Link>
          </Button>
          <p className="font-mono text-sm text-muted-foreground">{asset.skuOrInternalId}</p>
          <h1 className="text-3xl font-semibold text-primary">{asset.name}</h1>
          <div className="mt-3 flex flex-wrap gap-2">
            <ConditionBadge
              code={asset.conditionCode}
              label={labelMaps.conditionLabelByCode.get(asset.conditionCode)}
            />
            <OperationalBadge
              code={asset.operationalStatusCode}
              label={labelMaps.operationalStatusLabelByCode.get(asset.operationalStatusCode)}
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm">
            <Link href="/login">Sign in to request</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-primary">Availability</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold tabular-nums">
            {asset.quantityAvailable}/{asset.quantityTotal}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-primary">Tracked units</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold tabular-nums">
            {asset.trackedUnitCount}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-primary">Status</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Review this item publicly, then sign in to start a request.
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <div className="space-y-6">
          {asset.imagePath ? (
            <AssetImage
              src={asset.imagePath}
              alt={`Photo of ${asset.name}`}
              sizes="(max-width: 1024px) 100vw, 60vw"
              className="aspect-video"
            />
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle className="text-primary">Public details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                <span className="text-foreground">Category:</span> {asset.categoryName ?? "General"}
              </p>
              <p>
                <span className="text-foreground">Location:</span> {asset.locationName ?? "Shared"}
              </p>
              <p>
                <span className="text-foreground">Availability:</span> {asset.quantityAvailable}/
                {asset.quantityTotal}
              </p>
              {asset.projectId && asset.projectName ? (
                <p>
                  <span className="text-foreground">Project:</span>{" "}
                  <Link
                    href={`/portfolio/projects/${asset.projectId}`}
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    {asset.projectName}
                  </Link>
                </p>
              ) : null}
              {asset.acquiredAt ? (
                <p>
                  <span className="text-foreground">Acquired:</span>{" "}
                  {asset.acquiredAt.toLocaleDateString()}
                </p>
              ) : null}
              {asset.notes?.trim() ? (
                <div className="space-y-1 pt-2">
                  <p className="font-medium text-foreground">Notes</p>
                  <p className="whitespace-pre-wrap">{asset.notes}</p>
                </div>
              ) : asset.notesPreview ? (
                <p className="pt-2">{asset.notesPreview}</p>
              ) : null}
              {asset.quoteUrl ? (
                <p>
                  <a
                    href={asset.quoteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    Open documentation
                  </a>
                </p>
              ) : null}
              {asset.specs ? (
                <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs text-foreground">
                  {JSON.stringify(asset.specs, null, 2)}
                </pre>
              ) : null}
            </CardContent>
          </Card>

          {asset.projectId && asset.projectName ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-primary">Linked project</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>
                  This item is associated with{" "}
                  <Link
                    href={`/portfolio/projects/${asset.projectId}`}
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    {asset.projectName}
                  </Link>
                  .
                </p>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/portfolio/projects/${asset.projectId}`}>Open project page</Link>
                </Button>
              </CardContent>
            </Card>
          ) : null}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-primary">How requests work</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                Public visitors can review equipment here first. Checkout requests, approvals,
                and tracking stay inside the authenticated app.
              </p>
              <Button asChild className="w-full">
                <Link href="/login">Sign in as a student to request equipment</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
