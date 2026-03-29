"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGear, faUser } from "@fortawesome/free-solid-svg-icons";

export function AuditActor(props: {
  user: { name: string | null; email: string } | null;
  className?: string;
}) {
  const { user, className = "" } = props;
  const label = user ? user.name || user.email : "System";

  return (
    <span
      className={`inline-flex min-w-0 items-center gap-2 text-muted-foreground ${className}`.trim()}
    >
      <FontAwesomeIcon
        icon={user ? faUser : faGear}
        className="size-3.5 shrink-0 text-muted-foreground/80"
        aria-hidden
      />
      <span className="min-w-0 truncate">{label}</span>
    </span>
  );
}
