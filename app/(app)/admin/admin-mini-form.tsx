"use client";

import { useActionState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import type { ActionResult } from "@/lib/form/action-result";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/form/submit-button";

const initial: ActionResult = { ok: true };

export function AdminMiniForm({
  action,
  fieldName,
  label,
}: {
  action: (prev: ActionResult, formData: FormData) => Promise<ActionResult>;
  fieldName: string;
  label: string;
}) {
  const [state, formAction] = useActionState(action, initial);

  return (
    <form action={formAction} className="flex flex-col gap-2 sm:flex-row sm:items-end">
      <div className="flex-1 space-y-1">
        <Label htmlFor={fieldName}>{label}</Label>
        <Input id={fieldName} name={fieldName} required />
        {!state.ok && state.fieldErrors?.[fieldName] ? (
          <p className="text-xs text-destructive">{state.fieldErrors[fieldName][0]}</p>
        ) : null}
        {!state.ok && state.formError ? (
          <p className="text-xs text-destructive">{state.formError}</p>
        ) : null}
      </div>
      <SubmitButton size="sm" pendingLabel="…">
        <FontAwesomeIcon icon={faPlus} className="size-4" />
        Add
      </SubmitButton>
    </form>
  );
}
