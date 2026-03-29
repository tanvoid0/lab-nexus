"use client";

import Image from "next/image";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBell,
  faBoxesStacked,
  faClipboardList,
  faDiagramProject,
  faRightFromBracket,
  faUser,
  faUserShield,
} from "@fortawesome/free-solid-svg-icons";
import { effectivePrimaryRole } from "@/lib/auth/roles";
import { logoutAction } from "@/lib/actions/logout";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

export type AppHeaderProps = {
  user: {
    email?: string | null;
    name?: string | null;
    roles: string[];
  };
  unreadNotificationCount?: number;
};

const navClass =
  "inline-flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-white/10 hover:underline";

export function AppHeader({
  user,
  unreadNotificationCount = 0,
}: AppHeaderProps) {
  const primary = effectivePrimaryRole(user.roles);
  return (
    <header className="border-b border-border bg-primary text-primary-foreground">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4">
        <Link
          href="/inventory"
          className="flex items-center gap-2 font-semibold"
        >
          <span className="relative block h-9 w-auto shrink-0 aspect-[10/3]">
            <Image
              src="/logo.png"
              alt="Vehicle Computing Lab"
              fill
              className="object-contain object-left brightness-0 invert"
              sizes="128px"
              priority
            />
          </span>
          <span className="hidden sm:inline">Lab Nexus</span>
        </Link>
        <nav className="flex flex-1 flex-wrap items-center gap-1 text-sm sm:gap-2">
          <Link href="/inventory" className={navClass}>
            <FontAwesomeIcon icon={faBoxesStacked} className="size-3.5 opacity-90" />
            <span>Inventory</span>
          </Link>
          <Link href="/checkouts" className={navClass}>
            <FontAwesomeIcon icon={faClipboardList} className="size-3.5 opacity-90" />
            <span>Checkouts</span>
          </Link>
          <Link href="/projects" className={navClass}>
            <FontAwesomeIcon icon={faDiagramProject} className="size-3.5 opacity-90" />
            <span>Projects</span>
          </Link>
          <Link href="/notifications" className={navClass}>
            <span className="relative inline-flex">
              <FontAwesomeIcon icon={faBell} className="size-3.5 opacity-90" />
              {unreadNotificationCount > 0 ? (
                <span
                  className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground"
                  aria-label={`${unreadNotificationCount} unread`}
                >
                  {unreadNotificationCount > 99 ? "99+" : unreadNotificationCount}
                </span>
              ) : null}
            </span>
            <span>Notifications</span>
          </Link>
          <Link href="/admin" className={navClass}>
            <FontAwesomeIcon icon={faUserShield} className="size-3.5 opacity-90" />
            <span>Admin</span>
          </Link>
        </nav>
        <div className="flex items-center gap-2 text-xs sm:gap-3 sm:text-sm">
          <span
            className={cn(
              "hidden max-w-[10rem] items-center gap-1.5 truncate md:inline-flex",
              "opacity-90",
            )}
            title={user.name || user.email || undefined}
          >
            <FontAwesomeIcon icon={faUser} className="size-3 shrink-0 opacity-80" />
            {user.name || user.email}
          </span>
          {primary ? (
            <span
              className="rounded bg-accent px-2 py-0.5 font-medium text-accent-foreground"
              title="Display-only primary role"
            >
              {primary}
            </span>
          ) : null}
          <form action={logoutAction}>
            <Button
              type="submit"
              variant="secondary"
              size="sm"
              className="bg-white/15 text-primary-foreground hover:bg-white/25"
              aria-label="Sign out"
            >
              <FontAwesomeIcon icon={faRightFromBracket} className="size-3.5" />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
