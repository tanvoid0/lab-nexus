"use client";

import { useActionState, useEffect, useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCoins, faFloppyDisk } from "@fortawesome/free-solid-svg-icons";
import { toast } from "sonner";
import { updateLabCurrencyConfigAction } from "@/lib/actions/lab-currency";
import type { ActionResult } from "@/lib/form/action-result";
import type { LabCurrencyResolved } from "@/lib/currency/types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FieldError } from "@/components/form/field-error";
import { SubmitButton } from "@/components/form/submit-button";
import { nativeSelectClassName } from "@/lib/form/native-field-classes";

const initial: ActionResult<{ config: LabCurrencyResolved }> = { ok: true };

type LabCurrencyFormProps = {
  initialResolved: LabCurrencyResolved;
  iso4217Codes: readonly string[];
};

export function LabCurrencyForm({
  initialResolved,
  iso4217Codes,
}: LabCurrencyFormProps) {
  const [state, formAction] = useActionState(updateLabCurrencyConfigAction, initial);

  const displayResolved = useMemo(() => {
    if (state.ok && state.data?.config) return state.data.config;
    return initialResolved;
  }, [state, initialResolved]);

  useEffect(() => {
    if (!state.ok && state.fieldErrors) {
      const keys = Object.keys(state.fieldErrors);
      if (keys.length) {
        document.querySelector<HTMLElement>(`[name="${keys[0]}"]`)?.focus();
      }
    }
  }, [state]);

  useEffect(() => {
    if (state.ok && state.data?.config) {
      toast.success("Currency settings saved.");
    }
  }, [state]);

  const additionalDefault = initialResolved.additionalTransactionCodes.join(", ");

  return (
    <div className="space-y-8">
      <form action={formAction} className="max-w-xl space-y-6">
        <div className="space-y-2">
          <Label htmlFor="functionalCurrencyCode" className="inline-flex items-center gap-2">
            <FontAwesomeIcon icon={faCoins} className="size-3.5 text-muted-foreground" />
            Functional (base) currency
          </Label>
          <p className="text-xs text-muted-foreground">
            Reporting and budget rollups use this as the lab&apos;s primary currency (ERP-style{" "}
            <strong className="font-medium text-foreground">functional currency</strong>). Vendor
            charges may still be recorded in other allowed transaction currencies.
          </p>
          <select
            id="functionalCurrencyCode"
            name="functionalCurrencyCode"
            className={nativeSelectClassName("h-10 max-w-xs")}
            defaultValue={initialResolved.functionalCurrencyCode}
            required
          >
            {iso4217Codes.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
          <FieldError errors={state.ok ? undefined : state.fieldErrors?.functionalCurrencyCode} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="additionalTransactionCodesRaw">
            Additional transaction currencies
          </Label>
          <p className="text-xs text-muted-foreground">
            ISO 4217 codes the lab uses on invoices or POs besides the functional currency (comma,
            space, or newline separated). The functional currency is always allowed; do not repeat it
            here.
          </p>
          <Textarea
            id="additionalTransactionCodesRaw"
            name="additionalTransactionCodesRaw"
            rows={4}
            className="font-mono text-sm"
            placeholder="EUR, GBP, JPY"
            defaultValue={additionalDefault}
          />
          <FieldError
            errors={state.ok ? undefined : state.fieldErrors?.additionalTransactionCodesRaw}
          />
        </div>

        {!state.ok && state.formError ? (
          <p className="text-sm text-destructive" role="alert">
            {state.formError}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <SubmitButton type="submit" className="gap-2">
            <FontAwesomeIcon icon={faFloppyDisk} className="size-4" />
            Save
          </SubmitButton>
          <Button type="reset" variant="outline">
            Reset form
          </Button>
        </div>
      </form>

      <div className="max-w-xl rounded-lg border border-border bg-muted/30 p-4">
        <h2 className="text-sm font-medium text-primary">Effective allow list</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Codes permitted when you add procurement or invoice features: functional plus any
          additional codes above ({displayResolved.effectiveTransactionCurrencyCodes.length} total).
        </p>
        <p className="mt-3 font-mono text-sm tracking-wide text-foreground">
          {displayResolved.effectiveTransactionCurrencyCodes.join(", ")}
        </p>
      </div>
    </div>
  );
}
