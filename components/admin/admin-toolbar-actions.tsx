"use client";

import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBook,
  faChartColumn,
  faClockRotateLeft,
  faCoins,
  faFileArrowDown,
  faFileImport,
  faTruckRampBox,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
import { RefreshOverdueButton } from "@/components/admin/refresh-overdue-button";
import { Button } from "@/components/ui/button";

export function AdminToolbarActions({
  showReferenceData = false,
}: {
  /** Only admins can manage reference data; researchers still use other admin tools. */
  showReferenceData?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <RefreshOverdueButton />
      {showReferenceData ? (
        <>
          <Button asChild variant="secondary">
            <Link href="/admin/users" className="gap-2">
              <FontAwesomeIcon icon={faUsers} className="size-4" />
              Lab accounts
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/admin/reference-data" className="gap-2">
              <FontAwesomeIcon icon={faBook} className="size-4" />
              Reference data
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/settings/currencies" className="gap-2">
              <FontAwesomeIcon icon={faCoins} className="size-4" />
              Currencies
            </Link>
          </Button>
        </>
      ) : null}
      <Button asChild variant="secondary">
        <Link href="/admin/checkout-requests" className="gap-2">
          <FontAwesomeIcon icon={faTruckRampBox} className="size-4" />
          Loan approvals
        </Link>
      </Button>
      <Button asChild variant="secondary">
        <Link href="/admin/analytics" className="gap-2">
          <FontAwesomeIcon icon={faChartColumn} className="size-4" />
          Analytics
        </Link>
      </Button>
      <Button asChild variant="secondary">
        <Link href="/admin/audit" className="gap-2">
          <FontAwesomeIcon icon={faClockRotateLeft} className="size-4" />
          Audit trail
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
