import { cn } from "@/lib/utils/cn";

const conditionStyles: Record<string, string> = {
  WORKING: "bg-emerald-100 text-emerald-900",
  BROKEN: "bg-destructive/15 text-destructive",
  IN_REPAIR: "bg-amber-100 text-amber-950",
  UNKNOWN: "bg-muted text-muted-foreground",
};

const statusStyles: Record<string, string> = {
  AVAILABLE: "bg-primary/15 text-primary",
  MAINTENANCE: "bg-amber-100 text-amber-950",
  RETIRED: "bg-muted text-muted-foreground line-through decoration-muted-foreground/60",
};

function formatCodeFallback(code: string): string {
  return code.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

export function ConditionBadge({ code, label }: { code: string; label?: string }) {
  const display = label?.trim() || formatCodeFallback(code);
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
        conditionStyles[code] ?? "bg-muted text-foreground",
      )}
    >
      {display}
    </span>
  );
}

export function OperationalBadge({ code, label }: { code: string; label?: string }) {
  const display = label?.trim() || formatCodeFallback(code);
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
        statusStyles[code] ?? "bg-muted text-foreground",
      )}
    >
      {display}
    </span>
  );
}
