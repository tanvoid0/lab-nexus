"use client";

import { useActionState } from "react";
import type { ReferenceLookupEntry } from "@/lib/types/reference-lookup";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import {
  deleteLookupEntryAction,
  updateLookupEntryAction,
} from "@/lib/actions/reference-data";
import { actionFailureMessage } from "@/lib/form/action-result";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/form/submit-button";
import { referenceDataInitialActionState } from "@/components/admin/reference-data/constants";

type LookupRowProps = { entry: ReferenceLookupEntry };

export function LookupRow({ entry }: LookupRowProps) {
  const [uState, updateAction] = useActionState(
    updateLookupEntryAction,
    referenceDataInitialActionState,
  );
  const [dState, deleteAction] = useActionState(
    deleteLookupEntryAction,
    referenceDataInitialActionState,
  );
  const updateErr = actionFailureMessage(uState);

  return (
    <li className="space-y-2 border-b border-border py-3 last:border-0">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">{entry.code}</code>
        {entry.isSystem ? (
          <span className="text-xs text-muted-foreground">System</span>
        ) : null}
        {!entry.isActive ? (
          <span className="text-xs text-amber-700 dark:text-amber-400">Inactive</span>
        ) : null}
      </div>
      <form action={updateAction} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-12 lg:items-end">
        <input type="hidden" name="id" value={entry.id} />
        <div className="space-y-1 lg:col-span-4">
          <Label className="text-xs text-muted-foreground">Label</Label>
          <Input name="label" defaultValue={entry.label} required className="text-sm" />
        </div>
        <div className="space-y-1 lg:col-span-2">
          <Label className="text-xs text-muted-foreground">Sort</Label>
          <Input
            name="sortOrder"
            type="number"
            min={0}
            max={9999}
            defaultValue={entry.sortOrder}
            className="text-sm"
          />
        </div>
        <div className="flex items-center gap-2 lg:col-span-3">
          <input
            type="checkbox"
            id={`active-${entry.id}`}
            name="isActive"
            value="on"
            defaultChecked={entry.isActive}
            className="size-4 rounded border-input"
          />
          <Label htmlFor={`active-${entry.id}`} className="text-sm font-normal">
            Active (shown in forms)
          </Label>
        </div>
        <div className="space-y-1 lg:col-span-12">
          <Label className="text-xs text-muted-foreground">Description (optional)</Label>
          <Input
            name="description"
            defaultValue={entry.description ?? ""}
            className="text-sm"
            placeholder="Internal note"
          />
        </div>
        <div className="flex flex-wrap gap-2 lg:col-span-12">
          <SubmitButton size="sm" variant="secondary" pendingLabel="…">
            Save
          </SubmitButton>
        </div>
      </form>
      {!entry.isSystem ? (
        <form
          action={deleteAction}
          className="flex flex-wrap gap-2"
          onSubmit={(e) => {
            if (!confirm(`Delete lookup “${entry.code}”?`)) e.preventDefault();
          }}
        >
          <input type="hidden" name="id" value={entry.id} />
          <Button type="submit" size="sm" variant="outline" className="text-destructive">
            <FontAwesomeIcon icon={faTrash} className="size-4" />
            Delete
          </Button>
        </form>
      ) : null}
      {updateErr ? <p className="text-xs text-destructive">{updateErr}</p> : null}
      {!dState.ok && dState.formError ? (
        <p className="text-xs text-destructive">{dState.formError}</p>
      ) : null}
    </li>
  );
}
