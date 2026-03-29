"use client";

import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFilterCircleXmark, faWarehouse } from "@fortawesome/free-solid-svg-icons";
import { Button } from "@/components/ui/button";
import { InventoryNewAssetLink } from "@/components/inventory/inventory-new-asset-link";

export function InventoryEmptyPanel({
  variant,
  canEdit,
}: {
  variant: "catalog" | "filtered";
  canEdit: boolean;
}) {
  if (variant === "catalog") {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-center sm:p-8">
        <FontAwesomeIcon
          icon={faWarehouse}
          className="mx-auto size-12 text-muted-foreground"
          aria-hidden
        />
        <h2 className="mt-4 text-lg font-semibold text-primary">No assets yet</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Add your first item to start tracking inventory and checkouts.
        </p>
        {canEdit ? (
          <div className="mt-6 flex w-full flex-col gap-3 sm:mx-auto sm:max-w-xs">
            <InventoryNewAssetLink className="w-full" />
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-6 text-center sm:p-8">
      <FontAwesomeIcon
        icon={faFilterCircleXmark}
        className="mx-auto size-12 text-muted-foreground"
        aria-hidden
      />
      <h2 className="mt-4 text-lg font-semibold text-primary">No matching assets</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Try clearing filters or changing your search.
      </p>
      <div className="mt-6 flex w-full flex-col gap-3 sm:mx-auto sm:max-w-xs">
        <Button asChild variant="secondary" className="w-full">
          <Link href="/inventory">Clear filters</Link>
        </Button>
        {canEdit ? <InventoryNewAssetLink className="w-full" variant="outline" /> : null}
      </div>
    </div>
  );
}
