import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { hasAnyRole, LAB_ROLES_STAFF } from "@/lib/auth/roles";
import { prisma } from "@/lib/db";
import {
  CheckoutRequestLineStatus,
  CheckoutRequestStatus,
} from "@prisma/client";
import type { NextPageProps } from "@/lib/types/next-app";

function lineStatusLabel(s: CheckoutRequestLineStatus) {
  switch (s) {
    case CheckoutRequestLineStatus.PENDING:
      return "Pending review";
    case CheckoutRequestLineStatus.APPROVED:
      return "Approved for pickup";
    case CheckoutRequestLineStatus.ISSUED:
      return "Issued";
    case CheckoutRequestLineStatus.REJECTED:
      return "Rejected";
    default:
      return s;
  }
}

export default async function LoanRequestDetailPage({
  params,
}: NextPageProps<{ id: string }>) {
  const { id } = await params;
  const session = await auth();
  const roles = session!.user!.roles ?? [];
  const isStaff = hasAnyRole(roles, LAB_ROLES_STAFF);

  const req = await prisma.checkoutRequest.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, email: true } },
      defaultProject: { select: { name: true } },
      reviewer: { select: { name: true, email: true } },
      issuer: { select: { name: true, email: true } },
      lines: {
        orderBy: { createdAt: "asc" },
        include: {
          asset: { select: { id: true, name: true, skuOrInternalId: true } },
          project: { select: { name: true } },
          checkout: { select: { id: true } },
        },
      },
    },
  });

  if (!req) notFound();
  if (req.userId !== session!.user!.id && !isStaff) notFound();

  const pendingApproval = req.status === CheckoutRequestStatus.PENDING_APPROVAL;
  const readyForPickup = req.status === CheckoutRequestStatus.READY_FOR_PICKUP;
  const completed = req.status === CheckoutRequestStatus.COMPLETED;
  const steps: { key: string; label: string; state: "done" | "current" | "upcoming" }[] = [
    { key: "submitted", label: "Submitted", state: "done" },
    {
      key: "review",
      label: "Pending review",
      state: pendingApproval ? "current" : "done",
    },
    {
      key: "pickup",
      label: readyForPickup ? "Ready for pickup" : completed ? "Ready for pickup" : "Pickup",
      state: pendingApproval ? "upcoming" : readyForPickup ? "current" : completed ? "done" : "upcoming",
    },
    {
      key: "outcome",
      label: completed ? "Issued" : req.status === CheckoutRequestStatus.REJECTED ? "Not approved" : "Issued",
      state:
        req.status === CheckoutRequestStatus.REJECTED
          ? "done"
          : completed
            ? "done"
            : readyForPickup
              ? "upcoming"
              : pendingApproval
                ? "upcoming"
                : "upcoming",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-muted-foreground">
          <Link href="/requests" className="text-primary underline-offset-4 hover:underline">
            Requests
          </Link>
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-primary">Request detail</h1>
        <p className="text-sm text-muted-foreground">
          Submitted {req.createdAt.toLocaleString()}
          {isStaff ? (
            <>
              {" "}
              · Borrower: {req.user.name || req.user.email}
            </>
          ) : null}
        </p>
      </div>

      <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold text-primary">Progress</h2>
        <ol className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
          {steps.map((s, i) => (
            <li key={s.key} className="flex flex-1 items-start gap-3">
              <span
                className={
                  s.state === "done"
                    ? "flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"
                    : s.state === "current"
                      ? "flex size-9 shrink-0 items-center justify-center rounded-full border-2 border-primary text-primary"
                      : "flex size-9 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground"
                }
              >
                {s.state === "done" ? (
                  <span aria-hidden>✓</span>
                ) : s.state === "current" ? (
                  <span aria-hidden>…</span>
                ) : (
                  <span className="text-sm font-medium">{i + 1}</span>
                )}
              </span>
              <div>
                <p className="font-medium">{s.label}</p>
                {s.key === "submitted" ? (
                  <p className="text-xs text-muted-foreground">Request submitted to the lab.</p>
                ) : null}
                {s.key === "review" ? (
                  <p className="text-xs text-muted-foreground">
                    Staff confirm availability and policy.
                  </p>
                ) : null}
                {s.key === "pickup" ? (
                  <p className="text-xs text-muted-foreground">
                    Approved items wait here until staff hand them over.
                  </p>
                ) : null}
                {s.key === "outcome" ? (
                  <p className="text-xs text-muted-foreground">
                    {completed
                      ? "Equipment has been issued and is now on your account."
                      : readyForPickup
                        ? "Your request is approved and waiting for pickup."
                      : req.status === CheckoutRequestStatus.REJECTED
                        ? "This request was not approved."
                        : "—"}
                  </p>
                ) : null}
              </div>
              {i < steps.length - 1 ? (
                <span
                  aria-hidden
                  className="hidden text-muted-foreground sm:mt-2 sm:block sm:px-1"
                >
                  →
                </span>
              ) : null}
            </li>
          ))}
        </ol>
        {req.reviewNote ? (
          <p className="mt-4 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Staff note:</span> {req.reviewNote}
            {req.reviewer ? (
              <span className="block text-xs">
                — {req.reviewer.name || req.reviewer.email}
                {req.reviewedAt ? ` · ${req.reviewedAt.toLocaleString()}` : ""}
              </span>
            ) : null}
          </p>
        ) : null}
        {req.issuer ? (
          <p className="mt-3 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Issued by:</span> {req.issuer.name || req.issuer.email}
            {req.issuedAt ? ` · ${req.issuedAt.toLocaleString()}` : ""}
          </p>
        ) : null}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-primary">Lines</h2>
        <p className="text-sm text-muted-foreground">
          Due {req.sharedDueAt.toLocaleString()}
          {req.sharedPurpose?.trim()
            ? ` · Purpose: ${req.sharedPurpose}`
            : ""}
          {req.defaultProject ? ` · Default project: ${req.defaultProject.name}` : ""}
        </p>
        <ul className="space-y-3">
          {req.lines.map((line) => (
            <li
              key={line.id}
              className="rounded-lg border border-border bg-card p-4 text-sm shadow-sm"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <Link
                    href={`/inventory/${line.asset.id}`}
                    className="font-semibold text-primary hover:underline"
                  >
                    {line.asset.name}
                  </Link>
                  <p className="font-mono text-xs text-muted-foreground">
                    {line.asset.skuOrInternalId}
                  </p>
                  {line.project ? (
                    <p className="text-muted-foreground">Project: {line.project.name}</p>
                  ) : req.defaultProject ? (
                    <p className="text-muted-foreground">Project: {req.defaultProject.name} (default)</p>
                  ) : null}
                  {line.rejectReason ? (
                    <p className="mt-1 text-destructive">{line.rejectReason}</p>
                  ) : null}
                </div>
                <div className="flex flex-col items-start gap-2 sm:items-end">
                  <span
                    className={
                      line.status === CheckoutRequestLineStatus.ISSUED
                        ? "inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                        : line.status === CheckoutRequestLineStatus.APPROVED
                          ? "inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300"
                        : line.status === CheckoutRequestLineStatus.REJECTED
                          ? "inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive"
                          : "inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium"
                    }
                  >
                    {lineStatusLabel(line.status)}
                  </span>
                  {line.checkout ? (
                    <Link
                      href="/checkouts"
                      className="text-xs font-medium text-primary underline-offset-4 hover:underline"
                    >
                      View issued checkout
                    </Link>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
