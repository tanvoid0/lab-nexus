"use client";

import { useActionState } from "react";
import { importSpreadsheetAction } from "@/lib/actions/import";
import type { ActionResult } from "@/lib/form/action-result";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/form/submit-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const initial: ActionResult<{ imported: number; skipped: number }> = { ok: true };

export function ImportForm() {
  const [state, formAction] = useActionState(importSpreadsheetAction, initial);

  return (
    <Card className="max-w-lg border-border">
      <CardHeader>
        <CardTitle className="text-primary">Upload file</CardTitle>
        <CardDescription>
          After import, check inventory for new rows. Duplicates by SKU are skipped.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          {!state.ok && state.formError ? (
            <p className="text-sm text-destructive">{state.formError}</p>
          ) : null}
          {state.ok && state.data && "imported" in state.data ? (
            <p className="text-sm text-primary">
              Imported {state.data.imported}, skipped {state.data.skipped}.
            </p>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="file">File</Label>
            <input
              id="file"
              name="file"
              type="file"
              accept=".xlsx,.xls,.csv"
              required
              className="block w-full text-sm"
            />
          </div>
          <SubmitButton pendingLabel="Importing…">Import</SubmitButton>
        </form>
      </CardContent>
    </Card>
  );
}
