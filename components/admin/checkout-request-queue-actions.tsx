"use client";

import { useActionState } from "react";
import {
  approveCheckoutRequestAction,
  issueCheckoutRequestAction,
  rejectCheckoutRequestAction,
  rejectCheckoutRequestLineAction,
} from "@/lib/actions/checkout-request";
import type { ActionResult } from "@/lib/form/action-result";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const initial: ActionResult = { ok: true };

export function ApproveRequestForm({ requestId }: { requestId: string }) {
  const [state, formAction] = useActionState(approveCheckoutRequestAction, initial);
  return (
    <form action={formAction} className="inline-flex flex-col gap-2">
      <input type="hidden" name="requestId" value={requestId} />
      {!state.ok && state.formError ? (
        <p className="max-w-xs text-sm text-destructive" role="alert">
          {state.formError}
        </p>
      ) : null}
      <Button type="submit" className="gap-2">
        Approve for pickup
      </Button>
    </form>
  );
}

export function IssueRequestForm({ requestId }: { requestId: string }) {
  const [state, formAction] = useActionState(issueCheckoutRequestAction, initial);
  return (
    <form action={formAction} className="inline-flex flex-col gap-2">
      <input type="hidden" name="requestId" value={requestId} />
      {!state.ok && state.formError ? (
        <p className="max-w-xs text-sm text-destructive" role="alert">
          {state.formError}
        </p>
      ) : null}
      <Button type="submit" className="gap-2">
        Issue approved items
      </Button>
    </form>
  );
}

export function RejectRequestForm({ requestId }: { requestId: string }) {
  const [state, formAction] = useActionState(rejectCheckoutRequestAction, initial);
  return (
    <form action={formAction} className="flex max-w-xs flex-col gap-2">
      <input type="hidden" name="requestId" value={requestId} />
      <Label htmlFor={`reject-note-${requestId}`} className="sr-only">
        Rejection note
      </Label>
      <Textarea
        id={`reject-note-${requestId}`}
        name="note"
        placeholder="Reason if rejecting the whole request…"
        rows={2}
      />
      {!state.ok && state.formError ? (
        <p className="text-sm text-destructive" role="alert">
          {state.formError}
        </p>
      ) : null}
      <Button type="submit" variant="destructive" size="sm">
        Reject request
      </Button>
    </form>
  );
}

export function RejectLineForm({ lineId }: { lineId: string }) {
  const [state, formAction] = useActionState(rejectCheckoutRequestLineAction, initial);
  return (
    <form action={formAction} className="flex w-full max-w-md flex-col gap-2 lg:w-auto lg:min-w-[280px]">
      <input type="hidden" name="lineId" value={lineId} />
      <Label htmlFor={`reason-${lineId}`} className="text-xs">
        Reject this line
      </Label>
      <Input
        id={`reason-${lineId}`}
        name="reason"
        placeholder="Reason (required to reject)"
        required
        className="text-sm"
      />
      {!state.ok && state.formError ? (
        <p className="text-sm text-destructive" role="alert">
          {state.formError}
        </p>
      ) : null}
      <Button type="submit" variant="outline" size="sm">
        Reject line
      </Button>
    </form>
  );
}
