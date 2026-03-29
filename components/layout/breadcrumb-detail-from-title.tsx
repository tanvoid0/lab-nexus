"use client";

import { useBreadcrumbDetailLabel } from "@/components/layout/breadcrumb-detail-context";

/** Registers `title` with the nearest breadcrumb detail provider for breadcrumb display. */
export function BreadcrumbDetailFromTitle({ title }: { title: string }) {
  useBreadcrumbDetailLabel(title);
  return null;
}
