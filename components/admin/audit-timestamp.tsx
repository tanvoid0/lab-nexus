"use client";

import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClock } from "@fortawesome/free-solid-svg-icons";
import { formatAuditAbsolute, formatAuditRelativePhrase } from "@/lib/audit/format-when";

export function AuditTimestamp(props: {
  at: Date;
  className?: string;
  iconClassName?: string;
}) {
  const { at, className = "", iconClassName = "size-3.5 shrink-0 opacity-80" } = props;
  const absolute = formatAuditAbsolute(at);
  const [relative, setRelative] = useState<string | null>(null);

  useEffect(() => {
    function tick() {
      setRelative(formatAuditRelativePhrase(at, new Date()));
    }
    tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, [at]);

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-muted-foreground ${className}`.trim()}
      title={absolute}
    >
      <FontAwesomeIcon icon={faClock} className={iconClassName} aria-hidden />
      <span className="whitespace-nowrap">
        <time dateTime={at.toISOString()}>{absolute}</time>
        {relative ? <span className="text-muted-foreground/90"> · {relative}</span> : null}
      </span>
    </span>
  );
}
