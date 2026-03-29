import type { CheckoutStatus } from "@prisma/client";
import { prisma } from "@/lib/db";

const DAY_MS = 86_400_000;

export type CheckoutDayBucket = {
  /** ISO date yyyy-mm-dd */
  day: string;
  /** Short label for axis (e.g. day of month) */
  label: string;
  count: number;
};

/** Calendar-day buckets (UTC) for checkouts with `checkedOutAt` in the range. */
export async function getCheckoutBucketsForLastDays(
  dayCount: number,
): Promise<CheckoutDayBucket[]> {
  const now = new Date();
  const dayKeys: string[] = [];
  for (let i = dayCount - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * DAY_MS);
    dayKeys.push(d.toISOString().slice(0, 10));
  }
  const rangeStartUtc = new Date(`${dayKeys[0]}T00:00:00.000Z`);

  const checkoutsInRange = await prisma.checkout.findMany({
    where: { checkedOutAt: { gte: rangeStartUtc } },
    select: { checkedOutAt: true },
  });

  const perDay: Record<string, number> = Object.fromEntries(
    dayKeys.map((k) => [k, 0]),
  );
  for (const c of checkoutsInRange) {
    const k = c.checkedOutAt.toISOString().slice(0, 10);
    if (k in perDay) perDay[k] += 1;
  }

  return dayKeys.map((day) => ({
    day,
    label: day.slice(8),
    count: perDay[day] ?? 0,
  }));
}

const STATUS_ORDER: CheckoutStatus[] = ["ACTIVE", "RETURNED", "OVERDUE"];

/** Rows suitable for checkout status pie; zero-count statuses omitted. */
export async function getCheckoutStatusDistribution(): Promise<
  { status: CheckoutStatus; count: number }[]
> {
  const rows = await prisma.checkout.groupBy({
    by: ["status"],
    _count: { id: true },
  });
  const statusCounts: Partial<Record<CheckoutStatus, number>> = {};
  for (const s of rows) {
    statusCounts[s.status] = s._count.id;
  }
  return STATUS_ORDER.map((status) => ({
    status,
    count: statusCounts[status] ?? 0,
  })).filter((row) => row.count > 0);
}

/** All statuses in workflow order with counts (including zeros). */
export async function getCheckoutStatusCounts(): Promise<
  Record<CheckoutStatus, number>
> {
  const rows = await prisma.checkout.groupBy({
    by: ["status"],
    _count: { id: true },
  });
  const out: Record<CheckoutStatus, number> = {
    ACTIVE: 0,
    RETURNED: 0,
    OVERDUE: 0,
  };
  for (const s of rows) {
    out[s.status] = s._count.id;
  }
  return out;
}

export { STATUS_ORDER as CHECKOUT_STATUS_ORDER };
