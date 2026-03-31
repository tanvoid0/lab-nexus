"use server";

import { auth } from "@/auth";
import {
  assertAnyRole,
  hasAnyRole,
  LAB_ROLES,
  LAB_ROLES_STAFF,
} from "@/lib/auth/roles";
import {
  AuditAction,
  AuditEntityType,
  CheckoutRequestLineStatus,
  CheckoutRequestStatus,
} from "@prisma/client";
import { writeAuditLog } from "@/lib/audit";
import {
  failure,
  success,
  zodErrorToFieldErrors,
  type ActionResult,
} from "@/lib/form/action-result";
import { cartSubmitSchema } from "@/lib/schemas/cart-checkout";
import { prisma } from "@/lib/db";
import { notDeleted } from "@/lib/prisma/active-scopes";
import {
  approvePendingCheckoutRequestLines,
  issueApprovedCheckoutRequestLines,
  rejectAllPendingLines,
  syncCheckoutRequestStatus,
} from "@/lib/checkout/sync-checkout-request-status";
import { describeCartLinesBlocker } from "@/lib/checkout/validate-cart-lines";
import { clearUserCartForUserId } from "@/lib/actions/user-cart";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function dedupeCartLines(
  lines: { assetId: string; assetUnitId?: string; projectId?: string }[],
) {
  const map = new Map<
    string,
    { assetId: string; assetUnitId?: string; projectId?: string }
  >();
  for (const l of lines) {
    const key = `${l.assetId}:${l.assetUnitId?.trim() || ""}`;
    const prev = map.get(key);
    const projectId = l.projectId?.trim() || prev?.projectId;
    map.set(key, {
      assetId: l.assetId,
      assetUnitId: l.assetUnitId?.trim() || undefined,
      projectId: projectId?.trim() || undefined,
    });
  }
  return [...map.values()];
}

export async function submitCartCheckoutAction(
  _prev: ActionResult<{ requestId: string }>,
  formData: FormData,
): Promise<ActionResult<{ requestId: string }>> {
  const session = await auth();
  if (!session?.user?.id) return failure({ formError: "Sign in required." });
  if (!hasAnyRole(session.user.roles, LAB_ROLES)) {
    return failure({ formError: "You cannot borrow equipment with this account." });
  }

  let linesRaw: unknown;
  try {
    linesRaw = JSON.parse(String(formData.get("lines") ?? "null"));
  } catch {
    return failure({ formError: "Invalid request list payload." });
  }

  const parsed = cartSubmitSchema.safeParse({
    lines: linesRaw,
    defaultProjectId: (formData.get("defaultProjectId") as string) || undefined,
    purpose: formData.get("purpose"),
    dueAt: formData.get("dueAt"),
    conditionNote: (formData.get("conditionNote") as string) || undefined,
  });
  if (!parsed.success) {
    return failure({ fieldErrors: zodErrorToFieldErrors(parsed.error) });
  }

  const due = new Date(parsed.data.dueAt);
  if (Number.isNaN(due.getTime())) {
    return failure({ fieldErrors: { dueAt: ["Invalid date"] } });
  }
  if (due.getTime() < Date.now()) {
    return failure({ fieldErrors: { dueAt: ["Due date must be in the future"] } });
  }

  const lines = dedupeCartLines(parsed.data.lines);
  const defaultPid = parsed.data.defaultProjectId?.trim();
  if (defaultPid) {
    const proj = await prisma.project.findFirst({
      where: { id: defaultPid, ...notDeleted },
    });
    if (!proj) return failure({ formError: "Default project is not available." });
  }

  const validationLines = lines.map((l) => ({
    assetId: l.assetId,
    assetUnitId: l.assetUnitId,
    projectId: l.projectId?.trim() || defaultPid || undefined,
  }));
  const blocker = await describeCartLinesBlocker(prisma, validationLines, due);
  if (blocker) return failure({ formError: blocker });

  const autoFulfill = hasAnyRole(session.user.roles, LAB_ROLES_STAFF);
  const conditionOut = parsed.data.conditionNote?.trim()
    ? { note: parsed.data.conditionNote.trim() }
    : undefined;

  let requestId: string;
  try {
    requestId = await prisma.$transaction(async (tx) => {
      const request = await tx.checkoutRequest.create({
        data: {
          userId: session.user!.id,
          status: CheckoutRequestStatus.PENDING_APPROVAL,
          defaultProjectId: defaultPid || undefined,
          sharedPurpose: parsed.data.purpose,
          sharedDueAt: due,
          conditionOut: conditionOut ?? undefined,
        },
      });

      for (const line of lines) {
        const linePid = line.projectId?.trim();
        if (linePid) {
          const ok = await tx.project.findFirst({
            where: { id: linePid, ...notDeleted },
          });
          if (!ok) throw new Error(`Project no longer available for a line item.`);
        }
        await tx.checkoutRequestLine.create({
          data: {
            requestId: request.id,
            assetId: line.assetId,
            assetUnitId: line.assetUnitId || undefined,
            projectId: linePid || undefined,
            status: CheckoutRequestLineStatus.PENDING,
          },
        });
      }

      if (autoFulfill) {
        await approvePendingCheckoutRequestLines(tx, request.id);
        await issueApprovedCheckoutRequestLines(tx, {
          requestId: request.id,
          borrowerUserId: session.user!.id,
          sharedPurpose: parsed.data.purpose,
          sharedDueAt: due,
          conditionOut: conditionOut ?? undefined,
        });
        await tx.checkoutRequest.update({
          where: { id: request.id },
          data: {
            reviewerUserId: session.user.id,
            reviewedAt: new Date(),
            reviewNote: "Direct issue by lab staff.",
            issuerUserId: session.user.id,
            issuedAt: new Date(),
          },
        });
      } else {
        await syncCheckoutRequestStatus(tx, request.id);
      }

      return request.id;
    });
  } catch (e) {
    return failure({
      formError: e instanceof Error ? e.message : "Could not submit request.",
    });
  }

  await writeAuditLog({
    userId: session.user.id,
    entityType: AuditEntityType.CheckoutRequest,
    entityId: requestId,
    action: AuditAction.CREATE,
    diff: {
      lineCount: lines.length,
      autoFulfill,
      dueAt: due.toISOString(),
    },
  });

  await clearUserCartForUserId(session.user.id);

  revalidatePath("/inventory");
  revalidatePath("/checkouts");
  revalidatePath("/requests");
  revalidatePath("/admin/checkout-requests");
  revalidatePath("/cart");
  return success({ requestId });
}

export async function approveCheckoutRequestAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return failure({ formError: "Sign in required." });
  try {
    assertAnyRole(session.user.roles, LAB_ROLES_STAFF);
  } catch {
    return failure({ formError: "Not allowed." });
  }

  const requestId = String(formData.get("requestId") ?? "").trim();
  if (!requestId) return failure({ formError: "Missing request." });

  const req = await prisma.checkoutRequest.findFirst({
    where: { id: requestId, status: CheckoutRequestStatus.PENDING_APPROVAL },
    include: { lines: true },
  });
  if (!req) return failure({ formError: "Request is not pending approval." });
  if (!req.lines.some((l) => l.status === CheckoutRequestLineStatus.PENDING)) {
    return failure({ formError: "Nothing left to approve on this request." });
  }

  try {
    await prisma.$transaction(async (tx) => {
      await approvePendingCheckoutRequestLines(tx, req.id);
      await tx.checkoutRequest.update({
        where: { id: req.id },
        data: {
          reviewerUserId: session.user.id,
          reviewedAt: new Date(),
          reviewNote: "Approved and ready for pickup.",
        },
      });
    });
  } catch (e) {
    return failure({
      formError: e instanceof Error ? e.message : "Approval failed.",
    });
  }

  await writeAuditLog({
    userId: session.user.id,
    entityType: AuditEntityType.CheckoutRequest,
    entityId: requestId,
    action: AuditAction.UPDATE,
    diff: { approved: true, readyForPickup: true },
  });

  revalidatePath("/requests");
  revalidatePath(`/requests/${requestId}`);
  revalidatePath("/admin/checkout-requests");
  redirect("/admin/checkout-requests");
}

export async function issueCheckoutRequestAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return failure({ formError: "Sign in required." });
  try {
    assertAnyRole(session.user.roles, LAB_ROLES_STAFF);
  } catch {
    return failure({ formError: "Not allowed." });
  }

  const requestId = String(formData.get("requestId") ?? "").trim();
  if (!requestId) return failure({ formError: "Missing request." });

  const req = await prisma.checkoutRequest.findFirst({
    where: { id: requestId, status: CheckoutRequestStatus.READY_FOR_PICKUP },
    include: { lines: true },
  });
  if (!req) return failure({ formError: "Request is not ready for pickup." });
  if (!req.lines.some((l) => l.status === CheckoutRequestLineStatus.APPROVED)) {
    return failure({ formError: "Nothing is approved for pickup on this request." });
  }

  try {
    await prisma.$transaction(async (tx) => {
      await issueApprovedCheckoutRequestLines(tx, {
        requestId: req.id,
        borrowerUserId: req.userId,
        sharedPurpose: req.sharedPurpose,
        sharedDueAt: req.sharedDueAt,
        conditionOut: req.conditionOut ?? undefined,
      });
      await tx.checkoutRequest.update({
        where: { id: req.id },
        data: {
          issuerUserId: session.user.id,
          issuedAt: new Date(),
        },
      });
    });
  } catch (e) {
    return failure({
      formError: e instanceof Error ? e.message : "Issuance failed.",
    });
  }

  await writeAuditLog({
    userId: session.user.id,
    entityType: AuditEntityType.CheckoutRequest,
    entityId: requestId,
    action: AuditAction.UPDATE,
    diff: { issued: true },
  });

  revalidatePath("/inventory");
  revalidatePath("/checkouts");
  revalidatePath("/requests");
  revalidatePath(`/requests/${requestId}`);
  revalidatePath("/admin/checkout-requests");
  redirect("/admin/checkout-requests");
}

export async function rejectCheckoutRequestAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return failure({ formError: "Sign in required." });
  try {
    assertAnyRole(session.user.roles, LAB_ROLES_STAFF);
  } catch {
    return failure({ formError: "Not allowed." });
  }

  const requestId = String(formData.get("requestId") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim() || "Request denied.";
  if (!requestId) return failure({ formError: "Missing request." });

  const req = await prisma.checkoutRequest.findFirst({
    where: { id: requestId, status: CheckoutRequestStatus.PENDING_APPROVAL },
  });
  if (!req) return failure({ formError: "Request is not pending approval." });

  await prisma.$transaction(async (tx) => {
    await rejectAllPendingLines(tx, requestId, note);
    await tx.checkoutRequest.update({
      where: { id: requestId },
      data: {
        reviewerUserId: session.user.id,
        reviewedAt: new Date(),
        reviewNote: note,
      },
    });
  });

  await writeAuditLog({
    userId: session.user.id,
    entityType: AuditEntityType.CheckoutRequest,
    entityId: requestId,
    action: AuditAction.UPDATE,
    diff: { rejected: true, note },
  });

  revalidatePath("/requests");
  revalidatePath(`/requests/${requestId}`);
  revalidatePath("/admin/checkout-requests");
  redirect("/admin/checkout-requests");
}

export async function rejectCheckoutRequestLineAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return failure({ formError: "Sign in required." });
  try {
    assertAnyRole(session.user.roles, LAB_ROLES_STAFF);
  } catch {
    return failure({ formError: "Not allowed." });
  }

  const lineId = String(formData.get("lineId") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim() || "Line item denied.";
  if (!lineId) return failure({ formError: "Missing line." });

  const line = await prisma.checkoutRequestLine.findFirst({
    where: { id: lineId, status: CheckoutRequestLineStatus.PENDING },
    include: { request: true },
  });
  if (!line || line.request.status !== CheckoutRequestStatus.PENDING_APPROVAL) {
    return failure({ formError: "Line is not pending." });
  }

  await prisma.$transaction(async (tx) => {
    await tx.checkoutRequestLine.update({
      where: { id: lineId },
      data: {
        status: CheckoutRequestLineStatus.REJECTED,
        rejectReason: reason,
      },
    });
    await syncCheckoutRequestStatus(tx, line.requestId);
    await tx.checkoutRequest.update({
      where: { id: line.requestId },
      data: {
        reviewerUserId: session.user.id,
        reviewedAt: new Date(),
        reviewNote: "One or more lines were rejected.",
      },
    });
  });

  await writeAuditLog({
    userId: session.user.id,
    entityType: AuditEntityType.CheckoutRequest,
    entityId: line.requestId,
    action: AuditAction.UPDATE,
    diff: { rejectedLineId: lineId, reason },
  });

  revalidatePath("/requests");
  revalidatePath(`/requests/${line.requestId}`);
  revalidatePath("/admin/checkout-requests");
  redirect("/admin/checkout-requests");
}
