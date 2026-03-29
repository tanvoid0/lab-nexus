"use client";

import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChartColumn,
  faFileArrowDown,
  faFileImport,
} from "@fortawesome/free-solid-svg-icons";
import { RefreshOverdueButton } from "@/components/admin/refresh-overdue-button";
import { Button } from "@/components/ui/button";

export function AdminToolbarActions() {
  return (
    <div className="flex flex-wrap gap-2">
      <RefreshOverdueButton />
      <Button asChild variant="secondary">
        <Link href="/admin/analytics" className="gap-2">
          <FontAwesomeIcon icon={faChartColumn} className="size-4" />
          Analytics
        </Link>
      </Button>
      <Button asChild variant="secondary">
        <Link href="/admin/import" className="gap-2">
          <FontAwesomeIcon icon={faFileImport} className="size-4" />
          Import spreadsheet
        </Link>
      </Button>
      <Button asChild variant="outline">
        <a href="/api/admin/export/inventory" className="gap-2">
          <FontAwesomeIcon icon={faFileArrowDown} className="size-4" />
          Export inventory
        </a>
      </Button>
      <Button asChild variant="outline">
        <a href="/api/admin/export/checkouts" className="gap-2">
          <FontAwesomeIcon icon={faFileArrowDown} className="size-4" />
          Export checkouts
        </a>
      </Button>
    </div>
  );
}
