import { cn } from "@/lib/utils/cn";

/** Native `<select>` — aligned with `Input` sizing and focus ring until a Radix Select primitive exists. */
export const NATIVE_SELECT_CLASSES =
  "flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

export function nativeSelectClassName(extra?: string) {
  return cn(NATIVE_SELECT_CLASSES, extra);
}
