import Link from "next/link";
import { auth } from "@/auth";
import { hasAnyRole, LAB_ROLES } from "@/lib/auth/roles";
import { prisma } from "@/lib/db";
import {
  CheckoutRequestLineStatus,
  CheckoutRequestStatus,
} from "@prisma/client";
import { redirect } from "next/navigation";

function requestSummaryLabel(status: CheckoutRequestStatus) {
  switch (status) {
    case CheckoutRequestStatus.PENDING_APPROVAL:
      return "Awaiting approval";
    case CheckoutRequestStatus.FULFILLED:
      return "Assigned";
    case CheckoutRequestStatus.REJECTED:
      return "Rejected";
    default:
      return status;
  }
}

export default async function LoanRequestsPage() {
  const session = await auth();
  if (!hasAnyRole(session?.user?.roles, LAB_ROLES)) {
    redirect("/inventory");
  }

  const rows = await prisma.checkoutRequest.findMany({
    where: { userId: session!.user!.id },
    orderBy: { createdAt: "desc" },
    take: 60,
    include: {
      lines: { select: { status: true } },
      defaultProject: { select: { name: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-primary">Loan requests</h1>
        <p className="text-sm text-muted-foreground">
          Track cart submissions: pending staff review, approved assignments, or rejected lines.
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-muted/20 p-8 text-center text-sm text-muted-foreground">
          <p>No requests yet.</p>
          <p className="mt-2">
            <Link href="/cart" className="font-medium text-primary underline-offset-4 hover:underline">
              Open your cart
            </Link>{" "}
            or add items from inventory.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => {
            const pending = r.lines.filter(
              (l) => l.status === CheckoutRequestLineStatus.PENDING,
            ).length;
            const fulfilled = r.lines.filter(
              (l) => l.status === CheckoutRequestLineStatus.FULFILLED,
            ).length;
            const rejected = r.lines.filter(
              (l) => l.status === CheckoutRequestLineStatus.REJECTED,
            ).length;
            return (
              <li key={r.id}>
                <Link
                  href={`/requests/${r.id}`}
                  className="block rounded-lg border border-border bg-card p-4 shadow-sm transition-colors hover:bg-muted/30"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-medium text-primary">
                        Request · {r.createdAt.toLocaleString()}
                      </p>
                      {r.sharedPurpose?.trim() ? (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {r.sharedPurpose}
                        </p>
                      ) : null}
                      {r.defaultProject ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Default project: {r.defaultProject.name}
                        </p>
                      ) : null}
                    </div>
                    <div className="text-sm">
                      <p className="font-medium">{requestSummaryLabel(r.status)}</p>
                      <p className="text-muted-foreground">
                        {fulfilled} assigned · {pending} pending · {rejected} rejected ·{" "}
                        {r.lines.length} lines
                      </p>
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
