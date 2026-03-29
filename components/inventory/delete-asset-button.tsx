"use client";

import { useActionState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrashCan } from "@fortawesome/free-solid-svg-icons";
import { deleteAssetFormAction } from "@/lib/actions/assets";
import type { ActionResult } from "@/lib/form/action-result";
import { Button } from "@/components/ui/button";

const initial: ActionResult = { ok: true };

export function DeleteAssetButton({ assetId }: { assetId: string }) {
  const [state, formAction] = useActionState(deleteAssetFormAction, initial);

  return (
    <form action={formAction} className="inline">
      <input type="hidden" name="assetId" value={assetId} />
      {!state.ok && state.formError ? (
        <p className="mb-2 text-sm text-destructive">{state.formError}</p>
      ) : null}
      <Button type="submit" variant="destructive">
        <FontAwesomeIcon icon={faTrashCan} className="size-4" />
        Delete
      </Button>
    </form>
  );
}
