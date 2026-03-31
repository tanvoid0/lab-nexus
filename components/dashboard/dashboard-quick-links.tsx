"use client";

import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBell,
  faBoxesStacked,
  faClipboardCheck,
  faClipboardList,
  faDiagramProject,
  faTruckRampBox,
  faUserShield,
} from "@fortawesome/free-solid-svg-icons";
import { cn } from "@/lib/utils/cn";

export type DashboardQuickLinksProps = {
  unreadNotificationCount: number;
  className?: string;
};

export function DashboardQuickLinks({
  unreadNotificationCount,
  className,
}: DashboardQuickLinksProps) {
  const items = [
    {
      href: "/inventory",
      label: "Inventory",
      description: "Browse and search lab assets.",
      icon: faBoxesStacked,
    },
    {
      href: "/cart",
      label: "Request list",
      description: "Select equipment, then submit a checkout request.",
      icon: faClipboardCheck,
    },
    {
      href: "/requests",
      label: "Requests",
      description: "Track review, pickup, and issuance.",
      icon: faTruckRampBox,
    },
    {
      href: "/checkouts",
      label: "Issued items",
      description: "Items currently issued or overdue.",
      icon: faClipboardList,
    },
    {
      href: "/projects",
      label: "Projects",
      description: "Teams and shared context.",
      icon: faDiagramProject,
    },
    {
      href: "/notifications",
      label: "Notifications",
      description: "Alerts and updates for your account.",
      icon: faBell,
      badgeCount: unreadNotificationCount,
    },
    {
      href: "/admin",
      label: "Admin",
      description: "Imports, audit, and lab settings.",
      icon: faUserShield,
    },
  ] as const;

  return (
    <ul
      className={cn("grid gap-3 sm:grid-cols-2 lg:grid-cols-3", className)}
      aria-label="Shortcuts"
    >
      {items.map((item) => (
        <li key={item.href}>
          <Link
            href={item.href}
            className="flex h-full min-h-[4.5rem] flex-col gap-1 rounded-lg border border-border bg-card p-4 text-left shadow-sm transition-colors hover:border-primary/35 hover:bg-muted/40"
          >
            <span className="flex items-center gap-2 font-medium text-foreground">
              <span className="relative inline-flex w-5 justify-center text-primary">
                <FontAwesomeIcon icon={item.icon} className="size-4 opacity-90" />
                {"badgeCount" in item && item.badgeCount > 0 ? (
                  <span
                    className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground"
                    aria-label={`${item.badgeCount} unread`}
                  >
                    {item.badgeCount > 99 ? "99+" : item.badgeCount}
                  </span>
                ) : null}
              </span>
              {item.label}
            </span>
            <span className="text-sm text-muted-foreground">{item.description}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
