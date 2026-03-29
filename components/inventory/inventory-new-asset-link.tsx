"use client";

import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { Button } from "@/components/ui/button";

export function InventoryNewAssetLink() {
  return (
    <Button asChild>
      <Link href="/inventory/new" className="gap-2">
        <FontAwesomeIcon icon={faPlus} className="size-4" />
        Add asset
      </Link>
    </Button>
  );
}
