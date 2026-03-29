"use client";

import { useActionState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { createLocationAction } from "@/lib/actions/reference-data";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/form/submit-button";
import { referenceDataInitialActionState } from "@/components/admin/reference-data/constants";

export function LocationCreateForm() {
  const [state, formAction] = useActionState(
    createLocationAction,
    referenceDataInitialActionState,
  );
  useEffect(() => {
    if (state.ok) {
      const el = document.querySelector<HTMLFormElement>("[data-location-create]");
      el?.reset();
    }
  }, [state.ok]);
  return (
    <form data-location-create action={formAction} className="flex flex-col gap-2 sm:flex-row sm:items-end">
      <div className="min-w-0 flex-1 space-y-1">
        <Label htmlFor="new-location-name">New location name</Label>
        <Input id="new-location-name" name="name" required placeholder="e.g. Room 314" />
      </div>
      <SubmitButton size="sm" pendingLabel="…">
        <FontAwesomeIcon icon={faPlus} className="size-4" />
        Add
      </SubmitButton>
      {!state.ok && state.formError ? (
        <p className="w-full text-xs text-destructive sm:basis-full">{state.formError}</p>
      ) : null}
    </form>
  );
}
