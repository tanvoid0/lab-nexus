import Link from "next/link";
import { ConditionBadge, OperationalBadge } from "@/components/inventory/asset-status-badge";
import { AssetImage } from "@/components/inventory/asset-image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PublicAssetShowcaseItem } from "@/lib/portfolio/public-showcase";

type PublicInventoryGridProps = {
  assets: PublicAssetShowcaseItem[];
  conditionLabels?: Record<string, string>;
  operationalLabels?: Record<string, string>;
};

export function PublicInventoryGrid({
  assets,
  conditionLabels = {},
  operationalLabels = {},
}: PublicInventoryGridProps) {
  if (assets.length === 0) {
    return (
      <Card className="border-dashed bg-muted/20">
        <CardContent className="pt-6 text-sm text-muted-foreground">
          No public inventory highlights are available yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 min-[1800px]:grid-cols-4">
      {assets.map((asset) => (
        <Card key={asset.id} className="group flex h-full flex-col overflow-hidden">
          {asset.imagePath ? (
            <AssetImage
              src={asset.imagePath}
              alt={`Photo of ${asset.name}`}
              sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, (max-width: 1800px) 33vw, 25vw"
              className="aspect-[4/3] rounded-b-none rounded-t-lg border-x-0 border-t-0 bg-muted/30"
              imageClassName="object-cover object-center transition-transform duration-300 group-hover:scale-105"
            />
          ) : null}
          <CardHeader className="space-y-3">
            <div className="space-y-1">
              <p className="font-mono text-xs text-muted-foreground">{asset.skuOrInternalId}</p>
              <CardTitle className="text-primary">{asset.name}</CardTitle>
            </div>
            <div className="flex flex-wrap gap-2">
              <ConditionBadge
                code={asset.conditionCode}
                label={conditionLabels[asset.conditionCode]}
              />
              <OperationalBadge
                code={asset.operationalStatusCode}
                label={operationalLabels[asset.operationalStatusCode]}
              />
            </div>
          </CardHeader>
          <CardContent className="flex-1 space-y-2 text-sm text-muted-foreground">
            <p>
              <span className="text-foreground">Available:</span> {asset.quantityAvailable}/
              {asset.quantityTotal}
            </p>
            <p>
              <span className="text-foreground">Category:</span> {asset.categoryName ?? "General"}
            </p>
            <p>
              <span className="text-foreground">Location:</span> {asset.locationName ?? "Shared"}
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
            {asset.notesPreview ? <p>{asset.notesPreview}</p> : null}
          </CardContent>
          <div className="flex flex-wrap gap-2 px-6 pb-6 pt-0">
            <Button asChild variant="outline" size="sm">
              <Link href={`/portfolio/inventory/${asset.id}`}>View details</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/login">Sign in to request</Link>
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
