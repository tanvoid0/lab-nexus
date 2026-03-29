"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  importSpreadsheetAction,
  type ImportSpreadsheetActionData,
} from "@/lib/actions/import";
import type { ActionResult } from "@/lib/form/action-result";
import type { ImportRowPlan } from "@/lib/import/spreadsheet-row-plan";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleCheck,
  faEye,
  faFileImport,
  faFilterCircleXmark,
  faSpinner,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import { cn } from "@/lib/utils/cn";

const initial: ActionResult<ImportSpreadsheetActionData> = { ok: true };

const PREVIEW_ROW_CAP = 40;

function statusMeta(status: ImportRowPlan["status"]) {
  switch (status) {
    case "imported":
      return {
        label: "Would import",
        className: "bg-primary/15 text-primary",
        icon: faCircleCheck,
      };
    case "duplicate":
      return {
        label: "Duplicate SKU",
        className: "bg-amber-500/15 text-amber-800 dark:text-amber-200",
        icon: faFilterCircleXmark,
      };
    case "empty":
      return {
        label: "Skipped (empty)",
        className: "bg-muted text-muted-foreground",
        icon: faTriangleExclamation,
      };
    case "skipped_error":
      return {
        label: "Error",
        className: "bg-destructive/15 text-destructive",
        icon: faTriangleExclamation,
      };
    default:
      return {
        label: status,
        className: "bg-muted text-muted-foreground",
        icon: faTriangleExclamation,
      };
  }
}

export function ImportForm() {
  const [state, formAction, isPending] = useActionState(importSpreadsheetAction, initial);
  const handled = useRef<typeof state | null>(null);
  const [lastIntent, setLastIntent] = useState<"preview" | "apply">("apply");

  useEffect(() => {
    if (state === initial) {
      handled.current = null;
      return;
    }
    if (handled.current === state) return;
    handled.current = state;

    if (!state.ok && state.formError) {
      toast.error(state.formError);
      return;
    }
    if (state.ok && state.data?.kind === "apply") {
      const { imported, skipped, errors } = state.data;
      const suffix =
        errors > 0 ? ` ${errors} row(s) failed at insert time.` : "";
      toast.success(`Imported ${imported} row(s), skipped ${skipped}.${suffix}`);
    }
    if (state.ok && state.data?.kind === "preview") {
      toast.message("Preview ready", {
        description: `${state.data.summary.imported} to import, ${state.data.summary.skipped} skipped (${state.data.fileName}).`,
      });
    }
  }, [state]);

  const preview =
    state.ok && state.data?.kind === "preview" ? state.data : null;

  return (
    <div className="space-y-6">
      <Card className="max-w-3xl border-border">
        <CardHeader>
          <CardTitle className="text-primary">Upload file</CardTitle>
          <CardDescription>
            Use <strong>Preview</strong> for a dry-run (no database writes).{" "}
            <strong>Import</strong> applies the sheet. Duplicates by SKU are skipped.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            {!state.ok && state.formError ? (
              <p className="text-sm text-destructive" role="alert">
                {state.formError}
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
            <div className="flex flex-wrap gap-3">
              <Button
                type="submit"
                name="intent"
                value="preview"
                variant="outline"
                disabled={isPending}
                className="gap-2"
                onClick={() => setLastIntent("preview")}
              >
                {isPending && lastIntent === "preview" ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} spin className="size-4" />
                    Previewing…
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faEye} className="size-4 opacity-90" />
                    Preview import
                  </>
                )}
              </Button>
              <Button
                type="submit"
                name="intent"
                value="apply"
                disabled={isPending}
                className="gap-2"
                onClick={() => setLastIntent("apply")}
              >
                {isPending && lastIntent === "apply" ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} spin className="size-4" />
                    Importing…
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faFileImport} className="size-4 opacity-90" />
                    Import
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {preview ? (
        <Card className="max-w-3xl border-border">
          <CardHeader>
            <CardTitle className="text-primary">Preview</CardTitle>
            <CardDescription>
              Sheet <strong>{preview.sheetName}</strong> — {preview.fileName}. Row-level results
              assume inserts succeed; rare DB errors only appear when you run Import.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
              <div className="rounded-md border border-border bg-muted/40 px-3 py-2">
                <dt className="text-muted-foreground">Sheet rows</dt>
                <dd className="text-lg font-semibold text-foreground">{preview.summary.totalRows}</dd>
              </div>
              <div className="rounded-md border border-border bg-muted/40 px-3 py-2">
                <dt className="text-muted-foreground">Would import</dt>
                <dd className="text-lg font-semibold text-primary">{preview.summary.imported}</dd>
              </div>
              <div className="rounded-md border border-border bg-muted/40 px-3 py-2">
                <dt className="text-muted-foreground">Skipped</dt>
                <dd className="text-lg font-semibold text-foreground">{preview.summary.skipped}</dd>
              </div>
              <div className="rounded-md border border-border bg-muted/40 px-3 py-2">
                <dt className="text-muted-foreground">Empty rows</dt>
                <dd className="text-lg font-semibold text-foreground">{preview.summary.empty}</dd>
              </div>
              <div className="rounded-md border border-border bg-muted/40 px-3 py-2">
                <dt className="text-muted-foreground">Duplicate SKU</dt>
                <dd className="text-lg font-semibold text-foreground">{preview.summary.duplicate}</dd>
              </div>
            </dl>

            {preview.headers.length > 0 ? (
              <div>
                <p className="text-sm font-medium text-foreground">Columns detected (first row)</p>
                <p className="mt-1 text-xs text-muted-foreground">{preview.headers.join(" · ")}</p>
              </div>
            ) : null}

            <div className="overflow-x-auto rounded-md border border-border">
              <table className="w-full min-w-[32rem] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50 text-left">
                    <th className="px-3 py-2 font-medium">Row</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                    <th className="px-3 py-2 font-medium">Item</th>
                    <th className="px-3 py-2 font-medium">SKU / ID</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.plans.slice(0, PREVIEW_ROW_CAP).map((row) => {
                    const meta = statusMeta(row.status);
                    return (
                      <tr key={row.rowNum} className="border-b border-border/80">
                        <td className="px-3 py-2 tabular-nums text-muted-foreground">{row.rowNum}</td>
                        <td className="px-3 py-2">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
                              meta.className,
                            )}
                          >
                            <FontAwesomeIcon icon={meta.icon} className="size-3 opacity-90" />
                            {meta.label}
                          </span>
                        </td>
                        <td className="max-w-[12rem] truncate px-3 py-2">{row.label}</td>
                        <td className="max-w-[10rem] truncate px-3 py-2 font-mono text-xs">
                          {row.skuOrInternalId ?? "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {preview.plans.length > PREVIEW_ROW_CAP ? (
              <p className="text-xs text-muted-foreground">
                Showing first {PREVIEW_ROW_CAP} of {preview.plans.length} rows. Re-run preview after
                editing the sheet if needed.
              </p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
