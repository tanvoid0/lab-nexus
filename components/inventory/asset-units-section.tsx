"use client";

import { useActionState, useEffect, useId } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBarcode,
  faCircleNodes,
  faFingerprint,
  faNoteSticky,
  faPlus,
  faQrcode,
  faTag,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import {
  createAssetUnitAction,
  deleteAssetUnitAction,
} from "@/lib/actions/asset-unit";
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
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { type AssetUnitRow, unitLabel } from "@/lib/inventory/asset-unit";
import { scanPathForTrackTag } from "@/lib/nav/inventory-paths";

const initial: ActionResult = { ok: true };

export type { AssetUnitRow };

export function AssetUnitsSection({
  assetId,
  units,
  canManage,
}: {
  assetId: string;
  units: AssetUnitRow[];
  canManage: boolean;
}) {
  const [createState, createAction] = useActionState(
    createAssetUnitAction,
    initial,
  );

  useEffect(() => {
    if (!createState.ok && createState.fieldErrors) {
      const k = Object.keys(createState.fieldErrors)[0];
      if (k) document.querySelector<HTMLElement>(`[name="${k}"]`)?.focus();
    }
  }, [createState]);

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg text-primary">
          <FontAwesomeIcon icon={faCircleNodes} className="size-5" />
          Tracked units
        </CardTitle>
        <CardDescription>
          Serials or tags for individual checkout. When this asset has units,
          checkout requires picking one. Quantities stay in sync when you add or
          remove units.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {units.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No units yet — checkouts use aggregate quantity only.
          </p>
        ) : (
          <ul className="space-y-2 text-sm">
            {units.map((u) => (
              <li
                key={u.id}
                className="flex flex-col gap-2 rounded-md border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="space-y-1">
                  <p className="font-medium text-primary">{unitLabel(u)}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground">
                    {u.imei ? <span>IMEI: {u.imei}</span> : null}
                    {u.trackTag && u.trackTag !== u.serialNumber ? (
                      <span>Tag: {u.trackTag}</span>
                    ) : null}
                  </div>
                  {u.notes ? (
                    <p className="text-muted-foreground">{u.notes}</p>
                  ) : null}
                  {u.onLoan ? (
                    <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
                      On loan — return before removing this unit.
                    </p>
                  ) : null}
                </div>
                {u.trackTag?.trim() || (canManage && !u.onLoan) ? (
                  <div className="flex flex-wrap gap-2 self-start sm:self-center">
                    {u.trackTag?.trim() ? (
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="min-h-11 gap-1.5 sm:min-h-9"
                      >
                        <Link href={scanPathForTrackTag(u.trackTag.trim())}>
                          <FontAwesomeIcon icon={faQrcode} className="size-3.5" />
                          Open scan
                        </Link>
                      </Button>
                    ) : null}
                    {canManage && !u.onLoan ? (
                      <DeleteUnitButton unitId={u.id} />
                    ) : null}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}

        {canManage ? (
          <div className="border-t border-border pt-4">
            <p className="mb-3 text-sm font-medium text-primary">Add unit</p>
            <form action={createAction} className="space-y-3">
              <input type="hidden" name="assetId" value={assetId} />
              {!createState.ok && createState.formError ? (
                <p className="text-sm text-destructive" role="alert">
                  {createState.formError}
                </p>
              ) : null}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="unit-serial" className="inline-flex items-center gap-2">
                    <FontAwesomeIcon
                      icon={faBarcode}
                      className="size-3.5 text-muted-foreground"
                    />
                    Serial (optional)
                  </Label>
                  <Input id="unit-serial" name="serialNumber" />
                  {fieldErr(createState, "serialNumber")}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit-imei" className="inline-flex items-center gap-2">
                    <FontAwesomeIcon
                      icon={faFingerprint}
                      className="size-3.5 text-muted-foreground"
                    />
                    IMEI (optional)
                  </Label>
                  <Input id="unit-imei" name="imei" />
                  {fieldErr(createState, "imei")}
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="unit-track" className="inline-flex items-center gap-2">
                    <FontAwesomeIcon
                      icon={faTag}
                      className="size-3.5 text-muted-foreground"
                    />
                    Track tag (optional, unique)
                  </Label>
                  <Input id="unit-track" name="trackTag" />
                  {fieldErr(createState, "trackTag")}
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="unit-notes" className="inline-flex items-center gap-2">
                    <FontAwesomeIcon
                      icon={faNoteSticky}
                      className="size-3.5 text-muted-foreground"
                    />
                    Notes (optional)
                  </Label>
                  <Textarea id="unit-notes" name="notes" rows={2} />
                  {fieldErr(createState, "notes")}
                </div>
              </div>
              <SubmitButton pendingLabel="Adding…">
                <FontAwesomeIcon icon={faPlus} className="size-4" />
                Add unit
              </SubmitButton>
            </form>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function DeleteUnitButton({ unitId }: { unitId: string }) {
  const [state, formAction] = useActionState(deleteAssetUnitAction, initial);
  const formId = useId();
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="min-h-11 gap-1.5 self-start sm:min-h-9"
        >
          <FontAwesomeIcon icon={faTrash} className="size-3.5" />
          Remove
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove this unit?</AlertDialogTitle>
          <AlertDialogDescription>
            The unit will be removed from this asset. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {!state.ok && state.formError ? (
          <p className="text-sm text-destructive" role="alert">
            {state.formError}
          </p>
        ) : null}
        <form id={formId} action={formAction} className="hidden">
          <input type="hidden" name="unitId" value={unitId} />
        </form>
        <AlertDialogFooter>
          <AlertDialogCancel type="button" className="min-h-11 sm:min-h-9">
            Cancel
          </AlertDialogCancel>
          <Button
            type="submit"
            form={formId}
            variant="destructive"
            className="min-h-11 w-full sm:min-h-9 sm:w-auto"
          >
            Remove unit
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function fieldErr(state: ActionResult, key: string) {
  if (state.ok || !state.fieldErrors?.[key]) return null;
  return <p className="text-sm text-destructive">{state.fieldErrors[key][0]}</p>;
}
