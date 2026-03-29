"use client";

import { useMemo } from "react";
import { usePathname, useSelectedLayoutSegments } from "next/navigation";
import { useBreadcrumbDetailContext } from "@/components/layout/breadcrumb-detail-context";
import {
  buildBreadcrumbs,
  buildBreadcrumbsFromLayoutSegments,
  suppressLeadingHomeCrumb,
  withDetailLabel,
  type BreadcrumbItem,
} from "@/lib/nav/breadcrumbs";

export type UseAppBreadcrumbsResult = {
  items: BreadcrumbItem[];
  compactRoot: boolean;
};

/**
 * Breadcrumb trail for the app shell: layout segments (Next) + optional detail label from context.
 * Falls back to pathname parsing if layout segments are unavailable.
 */
export function useAppBreadcrumbs(): UseAppBreadcrumbsResult {
  const pathname = usePathname();
  const segments = useSelectedLayoutSegments();
  const detailCtx = useBreadcrumbDetailContext();
  const detailLabel = detailCtx?.detailLabel ?? null;

  /** Stable key for segment list; `\0null` means hook returned null (fallback to pathname). */
  const segmentKey = segments == null ? "\0null" : segments.join("/");

  return useMemo(() => {
    const base =
      segmentKey === "\0null"
        ? buildBreadcrumbs(pathname)
        : buildBreadcrumbsFromLayoutSegments(
            segmentKey === "" ? [] : segmentKey.split("/"),
          );
    const items = withDetailLabel(base, detailLabel);
    const compactRoot = suppressLeadingHomeCrumb(pathname);
    return { items, compactRoot };
  }, [pathname, segmentKey, detailLabel]);
}
