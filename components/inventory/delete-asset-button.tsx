"use client";

import { useActionState, useId } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrashCan } from "@fortawesome/free-solid-svg-icons";
import { deleteAssetFormAction } from "@/lib/actions/assets";
import type { ActionResult } from "@/lib/form/action-result";
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

const initial: ActionResult = { ok: true };

export function DeleteAssetButton({ assetId }: { assetId: string }) {
  const [state, formAction] = useActionState(deleteAssetFormAction, initial);
  const formId = useId();

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button type="button" variant="destructive" className="min-h-11 sm:min-h-9">
          <FontAwesomeIcon icon={faTrashCan} className="size-4" />
          Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this asset?</AlertDialogTitle>
          <AlertDialogDescription>
            This cannot be undone. Related checkouts, units, and audit entries may be
            affected or blocked.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {!state.ok && state.formError ? (
          <p className="text-sm text-destructive" role="alert">
            {state.formError}
          </p>
        ) : null}
        <form id={formId} action={formAction} className="hidden">
          <input type="hidden" name="assetId" value={assetId} />
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
            Delete permanently
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
