"use client";

import { useActionState, useEffect } from "react";
import type { ReferenceLookupEntry } from "@/lib/types/reference-lookup";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { createLookupEntryAction } from "@/lib/actions/reference-data";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/form/submit-button";
import { referenceDataInitialActionState } from "@/components/admin/reference-data/constants";

export function LookupCreateForm({ domain }: { domain: ReferenceLookupEntry["domain"] }) {
  const [state, formAction] = useActionState(
    createLookupEntryAction,
    referenceDataInitialActionState,
  );
  const title =
    domain === "ASSET_CONDITION" ? "New condition code" : "New operational status code";

  useEffect(() => {
    if (state.ok) {
      const sel = `[data-lookup-create="${domain}"]`;
      document.querySelector<HTMLFormElement>(sel)?.reset();
    }
  }, [state.ok, domain]);

  return (
    <form
      data-lookup-create={domain}
      action={formAction}
      className="grid gap-3 rounded-md border border-border bg-muted/20 p-4 sm:grid-cols-2 lg:grid-cols-12"
    >
      <input type="hidden" name="domain" value={domain} />
      <div className="space-y-1 sm:col-span-2 lg:col-span-3">
        <Label htmlFor={`code-${domain}`}>Code</Label>
        <Input
          id={`code-${domain}`}
          name="code"
          required
          className="font-mono text-sm"
          placeholder="UPPER_SNAKE"
        />
      </div>
      <div className="space-y-1 sm:col-span-2 lg:col-span-4">
        <Label htmlFor={`label-${domain}`}>Label</Label>
        <Input id={`label-${domain}`} name="label" required placeholder="Shown in UI" />
      </div>
      <div className="space-y-1 lg:col-span-2">
        <Label htmlFor={`sort-${domain}`}>Sort order</Label>
        <Input id={`sort-${domain}`} name="sortOrder" type="number" min={0} defaultValue={100} />
      </div>
      <div className="flex items-end lg:col-span-3">
        <SubmitButton size="sm" className="w-full sm:w-auto" pendingLabel="…">
          <FontAwesomeIcon icon={faPlus} className="size-4" />
          {title}
        </SubmitButton>
      </div>
      {!state.ok && (state.formError || state.fieldErrors) ? (
        <p className="text-xs text-destructive sm:col-span-2 lg:col-span-12">
          {state.formError || Object.values(state.fieldErrors ?? {}).flat()[0]}
        </p>
      ) : null}
    </form>
  );
}
