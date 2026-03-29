"use client";

import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

type InventoryNewAssetLinkProps = {
  className?: string;
  variant?: ButtonProps["variant"];
};

export function InventoryNewAssetLink({
  className,
  variant = "default",
}: InventoryNewAssetLinkProps) {
  return (
    <Button asChild variant={variant} className={cn("min-h-11 sm:min-h-9", className)}>
      <Link href="/inventory/new" className="gap-2">
        <FontAwesomeIcon icon={faPlus} className="size-4" />
        Add asset
      </Link>
    </Button>
  );
}
