"use client";

import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCartPlus, faMicrochip } from "@fortawesome/free-solid-svg-icons";
import { toast } from "sonner";
import { useCart } from "@/components/providers/cart-provider";
import { Button } from "@/components/ui/button";
import type { AssetListItem } from "@/lib/types/dto";

export function AddToCartInventoryCell({ row }: { row: AssetListItem }) {
  const { addLine, lines } = useCart();
  const available =
    row.operationalStatusCode === "AVAILABLE" && row.quantityAvailable > 0;
  const needsUnit = row.trackedUnitCount > 0;
  const key = `${row.id}:`;
  const inCart = lines.some((l) => `${l.assetId}:${l.assetUnitId ?? ""}` === key);

  if (!available) {
    return <span className="text-muted-foreground">—</span>;
  }

  if (needsUnit) {
    return (
      <Button variant="outline" size="sm" className="gap-1.5" asChild>
        <Link href={`/inventory/${row.id}`} title="Pick a unit on the asset page">
          <FontAwesomeIcon icon={faMicrochip} className="size-3.5 text-muted-foreground" />
          Unit
        </Link>
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant={inCart ? "secondary" : "outline"}
      size="sm"
      className="gap-1.5"
      disabled={inCart}
      onClick={() => {
        addLine({
          assetId: row.id,
          name: row.name,
          skuOrInternalId: row.skuOrInternalId,
        });
        toast.success(`${row.name} added to cart.`);
      }}
    >
      <FontAwesomeIcon icon={faCartPlus} className="size-3.5" />
      {inCart ? "Added" : "Add"}
    </Button>
  );
}
