import { cn } from "@/lib/utils/cn";
import type { AssetCondition, AssetOperationalStatus } from "@prisma/client";

const conditionStyles: Record<AssetCondition, string> = {
  WORKING: "bg-emerald-100 text-emerald-900",
  BROKEN: "bg-red-100 text-red-900",
  IN_REPAIR: "bg-amber-100 text-amber-900",
  UNKNOWN: "bg-muted text-muted-foreground",
};

const statusStyles: Record<AssetOperationalStatus, string> = {
  AVAILABLE: "bg-primary/15 text-primary",
  MAINTENANCE: "bg-amber-100 text-amber-900",
  RETIRED: "bg-muted text-muted-foreground",
};

export function ConditionBadge({ value }: { value: AssetCondition }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
        conditionStyles[value],
      )}
    >
      {value.replace("_", " ")}
    </span>
  );
}

export function OperationalBadge({ value }: { value: AssetOperationalStatus }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
        statusStyles[value],
      )}
    >
      {value.replace("_", " ")}
    </span>
  );
}
