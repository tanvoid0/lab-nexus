"use client";

import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronRight,
  faHouse,
} from "@fortawesome/free-solid-svg-icons";
import { useAppBreadcrumbs } from "@/lib/nav/use-app-breadcrumbs";
import { cn } from "@/lib/utils/cn";

type AppBreadcrumbsProps = {
  className?: string;
};

export function AppBreadcrumbs({ className }: AppBreadcrumbsProps) {
  const { items, compactRoot } = useAppBreadcrumbs();

  return (
    <nav aria-label="Breadcrumb" className={cn("min-w-0", className)}>
      <ol className="flex flex-wrap items-center gap-x-1 gap-y-0.5 text-sm">
        {!compactRoot ? (
          <li className="flex shrink-0 items-center">
            <Link
              href="/"
              className="inline-flex items-center gap-1 rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <FontAwesomeIcon icon={faHouse} className="size-3.5" aria-hidden />
              <span className="sr-only">Home</span>
            </Link>
          </li>
        ) : null}
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={item.href} className="flex min-w-0 max-w-full items-center gap-1">
              {(!compactRoot || i > 0) && (
                <FontAwesomeIcon
                  icon={faChevronRight}
                  className="size-3 shrink-0 text-muted-foreground/70"
                  aria-hidden
                />
              )}
              {isLast ? (
                <span
                  className="truncate font-medium text-foreground"
                  aria-current="page"
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="truncate text-muted-foreground transition-colors hover:text-foreground"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
