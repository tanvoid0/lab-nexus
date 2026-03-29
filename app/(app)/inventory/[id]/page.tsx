import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { hasAnyRole, hasRole } from "@/lib/auth/roles";
import { prisma } from "@/lib/db";
import { DeleteAssetButton } from "@/components/inventory/delete-asset-button";
import { Button } from "@/components/ui/button";
import { ConditionBadge, OperationalBadge } from "@/components/inventory/asset-status-badge";
import { CheckoutPanel } from "@/components/checkout/checkout-panel";
import { ReturnCheckoutForm } from "@/components/checkout/return-checkout-form";
import { AssetUnitsSection } from "@/components/inventory/asset-units-section";
import {
  checkoutUnitOptions,
  type AssetUnitRow,
} from "@/lib/inventory/asset-unit";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function AssetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const userId = session!.user!.id;
  const roles = session!.user!.roles ?? [];

  const [asset, projects, audits] = await Promise.all([
    prisma.asset.findUnique({
      where: { id },
      include: {
        category: true,
        location: true,
        custodian: { select: { name: true, email: true } },
        units: {
          orderBy: { createdAt: "asc" },
          include: {
            checkouts: {
              where: { status: { in: ["ACTIVE", "OVERDUE"] } },
              take: 1,
            },
          },
        },
        checkouts: {
          where: { status: { in: ["ACTIVE", "OVERDUE"] } },
          include: {
            user: { select: { name: true, email: true } },
            assetUnit: {
              select: {
                id: true,
                serialNumber: true,
                trackTag: true,
              },
            },
          },
          orderBy: { checkedOutAt: "desc" },
        },
      },
    }),
    prisma.project.findMany({ orderBy: { name: "asc" } }),
    prisma.auditLog.findMany({
      where: { entityType: "Asset", entityId: id },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { user: { select: { name: true, email: true } } },
    }),
  ]);

  if (!asset) notFound();

  const canEdit = hasAnyRole(roles, ["ADMIN", "RESEARCHER"]);
  const isAdmin = hasRole(roles, "ADMIN");
  const unitRows: AssetUnitRow[] = asset.units.map((u) => ({
    id: u.id,
    serialNumber: u.serialNumber,
    imei: u.imei,
    trackTag: u.trackTag,
    notes: u.notes,
    onLoan: u.checkouts.length > 0,
  }));
  const unitCheckoutChoices = checkoutUnitOptions(unitRows);
  const requiresUnit = unitRows.length > 0;
  const canCheckout =
    asset.operationalStatus === "AVAILABLE" &&
    asset.quantityAvailable > 0 &&
    (!requiresUnit || unitCheckoutChoices.length > 0) &&
    hasAnyRole(roles, ["ADMIN", "RESEARCHER", "STUDENT"]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-mono text-sm text-muted-foreground">
            {asset.skuOrInternalId}
          </p>
          <h1 className="text-2xl font-semibold text-primary">{asset.name}</h1>
          <div className="mt-2 flex flex-wrap gap-2">
            <ConditionBadge value={asset.condition} />
            <OperationalBadge value={asset.operationalStatus} />
            <span className="text-sm text-muted-foreground">
              Available {asset.quantityAvailable} / {asset.quantityTotal}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {canEdit ? (
            <Button asChild variant="secondary">
              <Link href={`/inventory/${asset.id}/edit`}>Edit</Link>
            </Button>
          ) : null}
          {asset.trackTag ? (
            <Button asChild variant="outline">
              <Link href={`/scan/${encodeURIComponent(asset.trackTag)}`}>
                Open scan link
              </Link>
            </Button>
          ) : null}
          {isAdmin ? <DeleteAssetButton assetId={asset.id} /> : null}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {asset.imagePath ? (
            <div className="relative aspect-video max-w-xl overflow-hidden rounded-lg border border-border bg-muted">
              <Image
                src={asset.imagePath}
                alt=""
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 640px"
              />
            </div>
          ) : null}

          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-primary">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                <span className="text-muted-foreground">Category:</span>{" "}
                {asset.category?.name ?? "—"}
              </p>
              <p>
                <span className="text-muted-foreground">Location:</span>{" "}
                {asset.location?.name ?? "—"}
              </p>
              <p>
                <span className="text-muted-foreground">Custodian:</span>{" "}
                {asset.custodian?.name || asset.custodian?.email || "—"}
              </p>
              {asset.acquiredAt ? (
                <p>
                  <span className="text-muted-foreground">Acquired:</span>{" "}
                  {asset.acquiredAt.toLocaleDateString()}
                </p>
              ) : null}
              {asset.quoteUrl ? (
                <p>
                  <span className="text-muted-foreground">Link:</span>{" "}
                  <a
                    href={asset.quoteUrl}
                    className="text-primary underline-offset-4 hover:underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Documentation / quote
                  </a>
                </p>
              ) : null}
              {asset.notes ? (
                <p className="whitespace-pre-wrap pt-2">{asset.notes}</p>
              ) : null}
              {asset.specs ? (
                <pre className="mt-2 overflow-x-auto rounded-md bg-muted p-3 text-xs">
                  {JSON.stringify(asset.specs, null, 2)}
                </pre>
              ) : null}
            </CardContent>
          </Card>

          <AssetUnitsSection
            assetId={asset.id}
            units={unitRows}
            canManage={canEdit}
          />

          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-primary">Audit trail</CardTitle>
              <CardDescription>Recent changes to this asset</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {audits.length === 0 ? (
                <p className="text-muted-foreground">No entries yet.</p>
              ) : (
                <ul className="space-y-2">
                  {audits.map((a) => (
                    <li key={a.id} className="border-b border-border pb-2 last:border-0">
                      <span className="font-medium">{a.action}</span>{" "}
                      <span className="text-muted-foreground">
                        {a.createdAt.toLocaleString()}
                      </span>
                      {a.user ? (
                        <span className="text-muted-foreground">
                          {" "}
                          — {a.user.name || a.user.email}
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {canCheckout ? (
            <CheckoutPanel
              assetId={asset.id}
              projects={projects}
              unitChoices={unitCheckoutChoices}
            />
          ) : (
            <Card className="border-border">
              <CardContent className="pt-6 text-sm text-muted-foreground">
                {requiresUnit && unitCheckoutChoices.length === 0 ? (
                  <>All tracked units are on loan.</>
                ) : (
                  <>
                    Checkout is disabled (unavailable, in maintenance, or no
                    stock).
                  </>
                )}
              </CardContent>
            </Card>
          )}

          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-lg text-primary">Active loans</CardTitle>
              <CardDescription>Return from here when equipment is back.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {asset.checkouts.length === 0 ? (
                <p className="text-sm text-muted-foreground">None.</p>
              ) : (
                asset.checkouts.map((c) => {
                  const canReturn =
                    c.userId === userId || hasRole(roles, "ADMIN");
                  return (
                    <div
                      key={c.id}
                      className="rounded-md border border-border p-3 text-sm"
                    >
                      <p className="font-medium">
                        {c.status === "OVERDUE" ? (
                          <span className="text-destructive">OVERDUE</span>
                        ) : (
                          "Active"
                        )}
                      </p>
                      <p className="text-muted-foreground">
                        {c.user.name || c.user.email}
                      </p>
                      <p>Due {c.dueAt.toLocaleString()}</p>
                      <p className="mt-1 text-muted-foreground">{c.purpose}</p>
                      {c.assetUnit ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Unit:{" "}
                          {c.assetUnit.serialNumber?.trim() ||
                            c.assetUnit.trackTag?.trim() ||
                            c.assetUnit.id.slice(-6)}
                        </p>
                      ) : null}
                      {canReturn ? (
                        <div className="mt-3 border-t border-border pt-3">
                          <ReturnCheckoutForm checkoutId={c.id} />
                        </div>
                      ) : null}
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
