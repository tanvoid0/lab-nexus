"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faLink,
  faImage,
  faQrcode,
  faTableColumns,
} from "@fortawesome/free-solid-svg-icons";
import { toast } from "sonner";
import { ConditionBadge, OperationalBadge } from "@/components/inventory/asset-status-badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  DEFAULT_OPTIONAL_COLUMN_VISIBILITY,
  INVENTORY_OPTIONAL_COLUMN_IDS,
  INVENTORY_OPTIONAL_COLUMN_LABELS,
  type InventoryOptionalColumnId,
  readStoredOptionalColumnVisibility,
  writeStoredOptionalColumnVisibility,
} from "@/lib/inventory/inventory-table-columns";
import type { AssetListItem } from "@/lib/types/dto";
import { AddToCartInventoryCell } from "@/components/cart/add-to-cart-inventory-cell";
import { AssetImage } from "@/components/inventory/asset-image";

type InventoryAssetTableProps = {
  rows: AssetListItem[];
  conditionLabels: Record<string, string>;
  operationalLabels: Record<string, string>;
  /** Show borrow-cart actions (session must allow checkout roles). */
  canUseCart?: boolean;
};

export function InventoryAssetTable({
  rows,
  conditionLabels,
  operationalLabels,
  canUseCart = false,
}: InventoryAssetTableProps) {
  const [optionalVisible, setOptionalVisible] = useState<
    Record<InventoryOptionalColumnId, boolean>
  >(() => ({ ...DEFAULT_OPTIONAL_COLUMN_VISIBILITY }));

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- apply device column prefs after mount; initial state matches SSR for hydration
    setOptionalVisible(readStoredOptionalColumnVisibility());
  }, []);

  const setColumn = (id: InventoryOptionalColumnId, checked: boolean) => {
    setOptionalVisible((prev) => {
      const next = { ...prev, [id]: checked };
      writeStoredOptionalColumnVisibility(next);
      return next;
    });
  };

  const copyViewLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link to this filtered view copied.");
    } catch {
      toast.error("Could not copy link.");
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => void copyViewLink()}
        >
          <FontAwesomeIcon icon={faLink} className="size-3.5 text-muted-foreground" />
          Copy view link
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="outline" size="sm" className="gap-2">
              <FontAwesomeIcon
                icon={faTableColumns}
                className="size-3.5 text-muted-foreground"
              />
              Columns
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal text-muted-foreground">
              <span>Optional columns (SKU and name always shown)</span>
              <span className="mt-1.5 block text-xs leading-snug">
                Scan QR encodes the asset-level track tag only; unit tags appear on the asset detail page.
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {INVENTORY_OPTIONAL_COLUMN_IDS.map((id) => (
              <DropdownMenuCheckboxItem
                key={id}
                checked={optionalVisible[id]}
                onCheckedChange={(v) => setColumn(id, v === true)}
              >
                {INVENTORY_OPTIONAL_COLUMN_LABELS[id]}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-muted/50">
            <tr>
              <th className="p-3 font-medium">SKU / ID</th>
              <th className="p-3 font-medium">Name</th>
              <th className="p-3 font-medium">
                <span className="inline-flex items-center gap-1.5">
                  <FontAwesomeIcon
                    icon={faImage}
                    className="size-3.5 text-muted-foreground"
                    aria-hidden
                  />
                  Photo
                </span>
              </th>
              {optionalVisible.category ? (
                <th className="p-3 font-medium">Category</th>
              ) : null}
              {optionalVisible.location ? (
                <th className="p-3 font-medium">Location</th>
              ) : null}
              {optionalVisible.project ? (
                <th className="p-3 font-medium">Project</th>
              ) : null}
              {optionalVisible.qty ? (
                <th className="p-3 font-medium">Qty</th>
              ) : null}
              {optionalVisible.scanQr ? (
                <th className="p-3 font-medium">
                  <span className="inline-flex items-center gap-1.5">
                    <FontAwesomeIcon
                      icon={faQrcode}
                      className="size-3.5 text-muted-foreground"
                      aria-hidden
                    />
                    Scan QR
                  </span>
                </th>
              ) : null}
              {optionalVisible.condition ? (
                <th className="p-3 font-medium">Condition</th>
              ) : null}
              {optionalVisible.status ? (
                <th className="p-3 font-medium">Status</th>
              ) : null}
              {canUseCart ? (
                <th className="p-3 font-medium">Request list</th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {rows.map((a) => (
              <tr
                key={a.id}
                className="border-b border-border last:border-0 hover:bg-muted/30"
              >
                <td className="p-3">
                  <Link
                    href={`/inventory/${a.id}`}
                    className="font-mono text-primary underline-offset-4 hover:underline"
                  >
                    {a.skuOrInternalId}
                  </Link>
                </td>
                <td className="p-3">{a.name}</td>
                <td className="p-3">
                  {a.imagePath ? (
                    <AssetImage
                      src={a.imagePath}
                      alt={`Photo of ${a.name}`}
                      sizes="64px"
                      className="aspect-square w-16"
                    />
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                {optionalVisible.category ? (
                  <td className="p-3 text-muted-foreground">
                    {a.categoryName ?? "—"}
                  </td>
                ) : null}
                {optionalVisible.location ? (
                  <td className="p-3 text-muted-foreground">
                    {a.locationName ?? "—"}
                  </td>
                ) : null}
                {optionalVisible.project ? (
                  <td className="p-3 text-muted-foreground">
                    {a.projectName ?? "—"}
                  </td>
                ) : null}
                {optionalVisible.qty ? (
                  <td className="p-3">
                    {a.quantityAvailable}/{a.quantityTotal}
                  </td>
                ) : null}
                {optionalVisible.scanQr ? (
                  <td className="p-3 align-middle">
                    {a.scanQrSrc ? (
                      <Link
                        href={`/inventory/${a.id}`}
                        className="inline-flex rounded-md border border-border bg-background p-1 shadow-sm transition-colors hover:bg-muted/50"
                        title="Open asset detail (QR encodes scan link for this row’s track tag)"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element -- same-origin /api/qr PNG */}
                        <img
                          src={a.scanQrSrc}
                          width={56}
                          height={56}
                          alt={`QR for track tag on ${a.skuOrInternalId}`}
                          className="size-14"
                        />
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                ) : null}
                {optionalVisible.condition ? (
                  <td className="p-3">
                    <ConditionBadge
                      code={a.conditionCode}
                      label={conditionLabels[a.conditionCode]}
                    />
                  </td>
                ) : null}
                {optionalVisible.status ? (
                  <td className="p-3">
                    <OperationalBadge
                      code={a.operationalStatusCode}
                      label={operationalLabels[a.operationalStatusCode]}
                    />
                  </td>
                ) : null}
                {canUseCart ? (
                  <td className="p-3 align-middle">
                    <AddToCartInventoryCell row={a} />
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
