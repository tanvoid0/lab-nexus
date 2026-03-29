"use client";

import { useActionState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClipboardList,
  faRotateLeft,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import { returnCheckoutAction } from "@/lib/actions/checkout";
import type { ActionResult } from "@/lib/form/action-result";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/form/submit-button";

const initial: ActionResult = { ok: true };

export function ReturnCheckoutForm({ checkoutId }: { checkoutId: string }) {
  const [state, formAction] = useActionState(returnCheckoutAction, initial);

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="checkoutId" value={checkoutId} />
      {!state.ok && state.formError ? (
        <p className="text-sm text-destructive">{state.formError}</p>
      ) : null}
      <div className="space-y-1">
        <Label
          htmlFor={`in-${checkoutId}`}
          className="inline-flex items-center gap-2"
        >
          <FontAwesomeIcon
            icon={faClipboardList}
            className="size-3.5 text-muted-foreground"
          />
          Condition on return
        </Label>
        <Textarea id={`in-${checkoutId}`} name="conditionNote" rows={2} />
      </div>
      <div className="space-y-1">
        <Label
          htmlFor={`dmg-${checkoutId}`}
          className="inline-flex items-center gap-2"
        >
          <FontAwesomeIcon
            icon={faTriangleExclamation}
            className="size-3.5 text-muted-foreground"
          />
          Damage report
        </Label>
        <Textarea id={`dmg-${checkoutId}`} name="damageReport" rows={2} />
      </div>
      <SubmitButton size="sm" variant="secondary" pendingLabel="Returning…">
        <FontAwesomeIcon icon={faRotateLeft} className="size-4" />
        Return
      </SubmitButton>
    </form>
  );
}
