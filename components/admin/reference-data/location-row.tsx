"use client";

import { useActionState } from "react";
import type { Location } from "@prisma/client";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import {
  deleteLocationAction,
  updateLocationAction,
} from "@/lib/actions/reference-data";
import { actionFailureMessage } from "@/lib/form/action-result";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/form/submit-button";
import { referenceDataInitialActionState } from "@/components/admin/reference-data/constants";

type LocationRowProps = { location: Location };

export function LocationRow({ location }: LocationRowProps) {
  const [uState, updateAction] = useActionState(
    updateLocationAction,
    referenceDataInitialActionState,
  );
  const [dState, deleteAction] = useActionState(
    deleteLocationAction,
    referenceDataInitialActionState,
  );
  const updateErr = actionFailureMessage(uState);
  const rowErrorClass =
    "w-full text-xs text-destructive sm:order-last sm:basis-full";

  return (
    <li className="flex flex-col gap-2 border-b border-border py-3 last:border-0 sm:flex-row sm:items-end">
      <form action={updateAction} className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-end">
        <input type="hidden" name="id" value={location.id} />
        <div className="min-w-0 flex-1 space-y-1">
          <Label className="text-xs text-muted-foreground">Name</Label>
          <Input name="name" defaultValue={location.name} required className="text-sm" />
        </div>
        <SubmitButton size="sm" variant="secondary" pendingLabel="…">
          Save
        </SubmitButton>
      </form>
      <form
        action={deleteAction}
        className="shrink-0"
        onSubmit={(e) => {
          if (!confirm(`Delete location “${location.name}”?`)) e.preventDefault();
        }}
      >
        <input type="hidden" name="id" value={location.id} />
        <Button type="submit" size="sm" variant="outline" className="text-destructive">
          <FontAwesomeIcon icon={faTrash} className="size-4" aria-hidden />
          <span className="sr-only">Delete</span>
        </Button>
      </form>
      {updateErr ? <p className={rowErrorClass}>{updateErr}</p> : null}
      {!dState.ok && dState.formError ? (
        <p className={rowErrorClass}>{dState.formError}</p>
      ) : null}
    </li>
  );
}
