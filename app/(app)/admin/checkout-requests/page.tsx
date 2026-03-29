import Link from "next/link";
import { auth } from "@/auth";
import { hasAnyRole, LAB_ROLES_STAFF } from "@/lib/auth/roles";
import { prisma } from "@/lib/db";
import { CheckoutRequestLineStatus, CheckoutRequestStatus } from "@prisma/client";
import { redirect } from "next/navigation";
import {
  ApproveRequestForm,
  RejectLineForm,
  RejectRequestForm,
} from "@/components/admin/checkout-request-queue-actions";
import { Button } from "@/components/ui/button";
import { unitLabel } from "@/lib/inventory/asset-unit";

export default async function AdminCheckoutRequestsPage() {
  const session = await auth();
  if (!hasAnyRole(session!.user!.roles, LAB_ROLES_STAFF)) {
    redirect("/inventory");
  }

  const [pending, recentResolved] = await Promise.all([
    prisma.checkoutRequest.findMany({
      where: { status: CheckoutRequestStatus.PENDING_APPROVAL },
      orderBy: { createdAt: "asc" },
      include: {
        user: { select: { name: true, email: true, deletedAt: true } },
        defaultProject: { select: { name: true } },
        lines: {
          orderBy: { createdAt: "asc" },
          include: {
            asset: { select: { id: true, name: true, skuOrInternalId: true } },
            assetUnit: {
              select: { id: true, serialNumber: true, trackTag: true },
            },
          },
        },
      },
    }),
    prisma.checkoutRequest.findMany({
      where: {
        status: { in: [CheckoutRequestStatus.FULFILLED, CheckoutRequestStatus.REJECTED] },
      },
      orderBy: { updatedAt: "desc" },
      take: 15,
      include: {
        user: { select: { name: true, email: true, deletedAt: true } },
        lines: { select: { id: true, status: true } },
      },
    }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-primary">Loan approvals</h1>
        <p className="text-sm text-muted-foreground">
          Student cart submissions wait here. Approve to create checkouts, reject entirely, or deny
          individual lines then approve the rest.
        </p>
      </div>

      {pending.length === 0 ? (
        <p className="text-sm text-muted-foreground">No requests awaiting approval.</p>
      ) : (
        <ul className="space-y-8">
          {pending.map((r) => (
            <li
              key={r.id}
              className="rounded-lg border border-border bg-card p-4 shadow-sm sm:p-6"
            >
              <div className="flex flex-col gap-2 border-b border-border pb-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-semibold text-primary">
                    {r.user.name || r.user.email}
                    {r.user.deletedAt ? (
                      <span className="ml-2 text-xs font-normal text-muted-foreground">
                        (deactivated)
                      </span>
                    ) : null}
                  </p>
                  <p className="text-xs text-muted-foreground">{r.user.email}</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Submitted {r.createdAt.toLocaleString()}
                    {r.defaultProject ? ` · Default project: ${r.defaultProject.name}` : ""}
                  </p>
                  <p className="mt-1 text-sm">Due {r.sharedDueAt.toLocaleString()}</p>
                  {r.sharedPurpose?.trim() ? (
                    <p className="mt-2 text-sm">{r.sharedPurpose}</p>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-start gap-4">
                  <ApproveRequestForm requestId={r.id} />
                  <RejectRequestForm requestId={r.id} />
                  <Button variant="outline" size="sm" asChild className="shrink-0">
                    <Link href={`/requests/${r.id}`}>Open tracking view</Link>
                  </Button>
                </div>
              </div>

              <ul className="mt-4 space-y-4">
                {r.lines.map((line) => (
                  <li
                    key={line.id}
                    className="rounded-md border border-border bg-muted/20 p-3 text-sm"
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="font-medium text-foreground">{line.asset.name}</p>
                        <p className="font-mono text-xs text-muted-foreground">
                          {line.asset.skuOrInternalId}
                        </p>
                        {line.assetUnit ? (
                          <p className="text-xs text-muted-foreground">
                            Unit: {unitLabel(line.assetUnit)}
                          </p>
                        ) : null}
                        <p className="mt-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          {line.status === CheckoutRequestLineStatus.PENDING
                            ? "Pending"
                            : line.status === CheckoutRequestLineStatus.FULFILLED
                              ? "Assigned"
                              : "Rejected"}
                        </p>
                      </div>
                      {line.status === CheckoutRequestLineStatus.PENDING ? (
                        <RejectLineForm lineId={line.id} />
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-primary">Recently closed</h2>
        <p className="text-sm text-muted-foreground">
          Latest fulfilled or fully rejected requests (newest first).
        </p>
        {recentResolved.length === 0 ? (
          <p className="text-sm text-muted-foreground">None yet.</p>
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border bg-card text-sm shadow-sm">
            {recentResolved.map((r) => {
              const fulfilled = r.lines.filter(
                (l) => l.status === CheckoutRequestLineStatus.FULFILLED,
              ).length;
              return (
                <li key={r.id} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium">{r.user.name || r.user.email}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.status === CheckoutRequestStatus.FULFILLED ? "Fulfilled" : "Rejected"} ·{" "}
                      {r.updatedAt.toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground">
                      {fulfilled}/{r.lines.length} assigned
                    </span>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/requests/${r.id}`}>View</Link>
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
