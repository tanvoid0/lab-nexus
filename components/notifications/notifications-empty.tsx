"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBellSlash } from "@fortawesome/free-solid-svg-icons";

export function NotificationsEmpty() {
  return (
    <p className="flex items-center gap-2 text-muted-foreground">
      <FontAwesomeIcon icon={faBellSlash} className="size-5 shrink-0 opacity-80" />
      No notifications yet.
    </p>
  );
}
