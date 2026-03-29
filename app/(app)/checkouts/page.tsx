import Link from "next/link";
import { auth } from "@/auth";
import { hasAnyRole, hasRole, LAB_ROLE, LAB_ROLES_STAFF } from "@/lib/auth/roles";
import { prisma } from "@/lib/db";
import type { CheckoutStatus } from "@prisma/client";
import { ReturnCheckoutForm } from "@/components/checkout/return-checkout-form";
import { CheckoutsEmpty } from "@/components/checkout/checkouts-empty";
import { checkoutBorrowerLabel } from "@/lib/checkout/borrower-display";

export default async function CheckoutsPage() {
  const session = await auth();
  const userId = session!.user!.id;
  const roles = session!.user!.roles ?? [];
  const isAdmin = hasRole(roles, LAB_ROLE.ADMIN);
  const canExportCheckouts = hasAnyRole(roles, LAB_ROLES_STAFF);

  const openStatuses: CheckoutStatus[] = ["ACTIVE", "OVERDUE"];
  const where = isAdmin
    ? { status: { in: openStatuses } }
    : { userId, status: { in: openStatuses } };

  const rows = await prisma.checkout.findMany({
    where,
    include: {
      asset: { select: { id: true, name: true, skuOrInternalId: true } },
      user: { select: { name: true, email: true, deletedAt: true } },
      project: { select: { name: true } },
      assetUnit: {
        select: { serialNumber: true, trackTag: true, id: true },
      },
    },
    orderBy: { dueAt: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-primary">Checkouts</h1>
          <p className="text-sm text-muted-foreground">
            {isAdmin ? "All active and overdue loans." : "Your active and overdue loans."}
          </p>
        </div>
        {canExportCheckouts ? (
          <a
            href="/api/admin/export/checkouts"
            className="shrink-0 text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Export all checkouts (CSV)
          </a>
        ) : null}
      </div>

      {rows.length === 0 ? (
        <CheckoutsEmpty />
      ) : (
        <div className="space-y-4">
          {rows.map((c) => {
            const canReturn = c.userId === userId || isAdmin;
            return (
              <div
                key={c.id}
                className="rounded-lg border border-border bg-card p-4 shadow-sm"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <Link
                      href={`/inventory/${c.asset.id}`}
                      className="font-semibold text-primary hover:underline"
                    >
                      {c.asset.name}
                    </Link>
                    <p className="font-mono text-xs text-muted-foreground">
                      {c.asset.skuOrInternalId}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Borrower: {checkoutBorrowerLabel(c.user)}
                    </p>
                    {c.project ? (
                      <p className="text-sm">Project: {c.project.name}</p>
                    ) : null}
                    {c.assetUnit ? (
                      <p className="text-sm text-muted-foreground">
                        Unit:{" "}
                        {c.assetUnit.serialNumber?.trim() ||
                          c.assetUnit.trackTag?.trim() ||
                          c.assetUnit.id.slice(-6)}
                      </p>
                    ) : null}
                    {c.purpose?.trim() ? (
                      <p className="text-sm">{c.purpose}</p>
                    ) : null}
                    <p
                      className={
                        c.status === "OVERDUE" || c.dueAt < new Date()
                          ? "text-sm font-medium text-destructive"
                          : "text-sm text-muted-foreground"
                      }
                    >
                      Due {c.dueAt.toLocaleString()}
                      {c.status === "OVERDUE" ? " — OVERDUE" : ""}
                    </p>
                  </div>
                  {canReturn ? (
                    <div className="min-w-[240px]">
                      <ReturnCheckoutForm checkoutId={c.id} />
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
