"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClipboardCheck } from "@fortawesome/free-solid-svg-icons";

export function CheckoutsEmpty() {
  return (
    <p className="flex items-center gap-2 text-muted-foreground">
      <FontAwesomeIcon icon={faClipboardCheck} className="size-5 shrink-0 opacity-80" />
      No open checkouts.
    </p>
  );
}
