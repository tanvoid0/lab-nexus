"use client";

import { useActionState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faAlignLeft,
  faCalendarDays,
  faCartFlatbed,
  faClipboardCheck,
  faFolderOpen,
  faMicrochip,
} from "@fortawesome/free-solid-svg-icons";
import { createCheckoutAction } from "@/lib/actions/checkout";
import type { ActionResult } from "@/lib/form/action-result";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/form/submit-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const initial: ActionResult = { ok: true };

export function CheckoutPanel({
  assetId,
  projects,
  unitChoices,
}: {
  assetId: string;
  projects: { id: string; name: string }[];
  /** When non-empty, user must pick a unit to check out. */
  unitChoices: { id: string; label: string }[];
}) {
  const [state, formAction] = useActionState(createCheckoutAction, initial);

  useEffect(() => {
    if (!state.ok && state.fieldErrors) {
      const k = Object.keys(state.fieldErrors)[0];
      if (k) document.querySelector<HTMLElement>(`[name="${k}"]`)?.focus();
    }
  }, [state]);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 7);
  const defaultDue = tomorrow.toISOString().slice(0, 16);

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg text-primary">
          <FontAwesomeIcon icon={faCartFlatbed} className="size-5" />
          Check out
        </CardTitle>
        <CardDescription>
          Borrow this asset. You must return or renew before the due date.
          {unitChoices.length > 0
            ? " Pick which serial or unit you are taking."
            : null}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-3">
          <input type="hidden" name="assetId" value={assetId} />
          {unitChoices.length > 0 ? (
            <div className="space-y-2">
              <Label
                htmlFor="assetUnitId"
                className="inline-flex items-center gap-2"
              >
                <FontAwesomeIcon
                  icon={faMicrochip}
                  className="size-3.5 text-muted-foreground"
                />
                Unit / serial
              </Label>
              <select
                id="assetUnitId"
                name="assetUnitId"
                required
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                defaultValue=""
              >
                <option value="" disabled>
                  Select a unit…
                </option>
                {unitChoices.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.label}
                  </option>
                ))}
              </select>
              {fieldErr(state, "assetUnitId")}
            </div>
          ) : null}
          {!state.ok && state.formError ? (
            <p className="text-sm text-destructive" role="alert">
              {state.formError}
            </p>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="purpose" className="inline-flex items-center gap-2">
              <FontAwesomeIcon
                icon={faAlignLeft}
                className="size-3.5 text-muted-foreground"
              />
              Purpose
            </Label>
            <Textarea id="purpose" name="purpose" required rows={2} />
            {fieldErr(state, "purpose")}
          </div>
          <div className="space-y-2">
            <Label htmlFor="dueAt" className="inline-flex items-center gap-2">
              <FontAwesomeIcon
                icon={faCalendarDays}
                className="size-3.5 text-muted-foreground"
              />
              Due
            </Label>
            <Input
              id="dueAt"
              name="dueAt"
              type="datetime-local"
              required
              defaultValue={defaultDue}
            />
            {fieldErr(state, "dueAt")}
          </div>
          <div className="space-y-2">
            <Label htmlFor="projectId" className="inline-flex items-center gap-2">
              <FontAwesomeIcon
                icon={faFolderOpen}
                className="size-3.5 text-muted-foreground"
              />
              Project (optional)
            </Label>
            <select
              id="projectId"
              name="projectId"
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">—</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="conditionNote"
              className="inline-flex items-center gap-2"
            >
              <FontAwesomeIcon
                icon={faClipboardCheck}
                className="size-3.5 text-muted-foreground"
              />
              Condition at checkout (optional)
            </Label>
            <Textarea id="conditionNote" name="conditionNote" rows={2} />
          </div>
          <SubmitButton pendingLabel="Checking out…">
            <FontAwesomeIcon icon={faCartFlatbed} className="size-4" />
            Check out
          </SubmitButton>
        </form>
      </CardContent>
    </Card>
  );
}

function fieldErr(state: ActionResult, key: string) {
  if (state.ok || !state.fieldErrors?.[key]) return null;
  return <p className="text-sm text-destructive">{state.fieldErrors[key][0]}</p>;
}
