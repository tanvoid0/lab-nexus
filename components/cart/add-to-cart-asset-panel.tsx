"use client";

import { useState } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCartPlus, faMicrochip } from "@fortawesome/free-solid-svg-icons";
import { toast } from "sonner";
import { useCart } from "@/components/providers/cart-provider";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { nativeSelectClassName } from "@/lib/form/native-field-classes";

export function AddToCartAssetPanel({
  assetId,
  name,
  skuOrInternalId,
  unitChoices,
}: {
  assetId: string;
  name: string;
  skuOrInternalId: string;
  unitChoices: { id: string; label: string }[];
}) {
  const { addLine, lines } = useCart();
  const [unitId, setUnitId] = useState(unitChoices[0]?.id ?? "");
  const requiresUnit = unitChoices.length > 0;
  const key = requiresUnit ? `${assetId}:${unitId}` : `${assetId}:`;
  const inCart = lines.some(
    (l) => `${l.assetId}:${l.assetUnitId ?? ""}` === key,
  );

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg text-primary">
          <FontAwesomeIcon icon={faCartPlus} className="size-5" />
          Add to cart
        </CardTitle>
        <CardDescription>
          Queue this item with others on the{" "}
          <Link href="/cart" className="text-primary underline-offset-4 hover:underline">
            cart page
          </Link>
          , then set a due date (and optional purpose). You can optionally tie the loan to a project there.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {requiresUnit ? (
          <div className="space-y-2">
            <Label htmlFor="cart-unit" className="inline-flex items-center gap-2">
              <FontAwesomeIcon
                icon={faMicrochip}
                className="size-3.5 text-muted-foreground"
              />
              Unit / serial
            </Label>
            <select
              id="cart-unit"
              value={unitId}
              onChange={(e) => setUnitId(e.target.value)}
              className={nativeSelectClassName()}
            >
              {unitChoices.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.label}
                </option>
              ))}
            </select>
          </div>
        ) : null}
        <Button
          type="button"
          variant={inCart ? "secondary" : "default"}
          className="gap-2"
          disabled={inCart || (requiresUnit && !unitId)}
          onClick={() => {
            addLine({
              assetId,
              name,
              skuOrInternalId,
              assetUnitId: requiresUnit ? unitId : undefined,
            });
            toast.success(`${name} added to cart.`);
          }}
        >
          <FontAwesomeIcon icon={faCartPlus} className="size-4" />
          {inCart ? "Already in cart" : "Add to cart"}
        </Button>
      </CardContent>
    </Card>
  );
}
