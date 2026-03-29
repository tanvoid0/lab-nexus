import type { Prisma } from "@prisma/client";
import { createSingleCheckout } from "@/lib/checkout/create-single-checkout";
import { prisma } from "@/lib/db";

type PrismaRoot = typeof prisma;

/** Mirrors `CheckoutRequestLineStatus` in prisma/schema.prisma */
const LineStatus = {
  PENDING: "PENDING",
  FULFILLED: "FULFILLED",
  REJECTED: "REJECTED",
} as const;

/** Mirrors `CheckoutRequestStatus` in prisma/schema.prisma */
const RequestStatus = {
  PENDING_APPROVAL: "PENDING_APPROVAL",
  FULFILLED: "FULFILLED",
  REJECTED: "REJECTED",
} as const;

type CheckoutRequestLineRow = { status: string };

type CheckoutRequestWithLines = {
  defaultProjectId: string | null;
  lines: Array<{
    id: string;
    status: string;
    projectId: string | null;
    assetId: string;
    assetUnitId: string | null;
  }>;
};

/**
 * Narrow delegate surface for this module. Some TS language servers resolve
 * `@prisma/client` before `.prisma` generation is visible, so `PrismaClient`
 * appears to omit checkout-request models; runtime and `tsc` match the schema.
 */
type CheckoutRequestFlowClient = {
  checkoutRequestLine: {
    findMany(args: {
      where: { requestId: string };
    }): Promise<CheckoutRequestLineRow[]>;
    update(args: {
      where: { id: string };
      data: { status: string; checkoutId: string };
    }): Promise<unknown>;
    updateMany(args: {
      where: { requestId: string; status: string };
      data: { status: string; rejectReason: string };
    }): Promise<unknown>;
  };
  checkoutRequest: {
    update(args: {
      where: { id: string };
      data: { status: string };
    }): Promise<unknown>;
    findUnique(args: {
      where: { id: string };
      include: { lines: { orderBy: { createdAt: "asc" } } };
    }): Promise<CheckoutRequestWithLines | null>;
  };
};

function asCheckoutRequestClient(
  db: PrismaRoot | Prisma.TransactionClient,
): CheckoutRequestFlowClient {
  return db as unknown as CheckoutRequestFlowClient;
}

/** Recompute request status from its lines (pending / fulfilled / all rejected). */
export async function syncCheckoutRequestStatus(
  db: PrismaRoot | Prisma.TransactionClient,
  requestId: string,
) {
  const client = asCheckoutRequestClient(db);
  const lines = await client.checkoutRequestLine.findMany({ where: { requestId } });
  if (lines.length === 0) return;
  const pending = lines.filter((l) => l.status === LineStatus.PENDING);
  const fulfilled = lines.filter((l) => l.status === LineStatus.FULFILLED);
  let status: (typeof RequestStatus)[keyof typeof RequestStatus];
  if (pending.length > 0) {
    status = RequestStatus.PENDING_APPROVAL;
  } else if (fulfilled.length === 0) {
    status = RequestStatus.REJECTED;
  } else {
    status = RequestStatus.FULFILLED;
  }
  await client.checkoutRequest.update({
    where: { id: requestId },
    data: { status },
  });
}

/** Fulfill every still-pending line on a request (used after approval). */
export async function fulfillPendingCheckoutRequestLines(
  tx: Prisma.TransactionClient,
  params: {
    requestId: string;
    borrowerUserId: string;
    sharedPurpose?: string | null;
    sharedDueAt: Date;
    /** From DB reads this is `JsonValue`; Prisma create expects `InputJsonValue`. */
    conditionOut?: Prisma.JsonValue | null;
  },
) {
  const client = asCheckoutRequestClient(tx);
  const req = await client.checkoutRequest.findUnique({
    where: { id: params.requestId },
    include: { lines: { orderBy: { createdAt: "asc" } } },
  });
  if (!req) throw new Error("Request not found.");
  for (const line of req.lines) {
    if (line.status !== LineStatus.PENDING) continue;
    const projectId = line.projectId ?? req.defaultProjectId ?? undefined;
    const res = await createSingleCheckout(tx, {
      userId: params.borrowerUserId,
      assetId: line.assetId,
      assetUnitId: line.assetUnitId,
      projectId,
      purpose: params.sharedPurpose?.trim() ? params.sharedPurpose.trim() : undefined,
      dueAt: params.sharedDueAt,
      conditionOut:
        params.conditionOut == null
          ? undefined
          : (params.conditionOut as Prisma.InputJsonValue),
    });
    if (!res.ok) {
      throw new Error(res.formError);
    }
    await client.checkoutRequestLine.update({
      where: { id: line.id },
      data: {
        status: LineStatus.FULFILLED,
        checkoutId: res.checkoutId,
      },
    });
  }
  await syncCheckoutRequestStatus(tx, params.requestId);
}

/** Mark every pending line rejected and sync request status (typically REJECTED). */
export async function rejectAllPendingLines(
  tx: Prisma.TransactionClient,
  requestId: string,
  reason: string,
) {
  const client = asCheckoutRequestClient(tx);
  await client.checkoutRequestLine.updateMany({
    where: { requestId, status: LineStatus.PENDING },
    data: {
      status: LineStatus.REJECTED,
      rejectReason: reason,
    },
  });
  await syncCheckoutRequestStatus(tx, requestId);
}
