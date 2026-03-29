"use client";

import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGear,
  faRightFromBracket,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import { logoutAction } from "@/lib/actions/logout";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils/cn";

type AppHeaderUserMenuProps = {
  displayName: string;
  email?: string | null;
  primaryRole: string | null;
  /** `header` = green app bar. `toolbar` = desktop top bar. `sidebar` = bottom of persistent nav. */
  variant?: "header" | "toolbar" | "sidebar";
};

export function AppHeaderUserMenu({
  displayName,
  email,
  primaryRole,
  variant = "header",
}: AppHeaderUserMenuProps) {
  const isGreenBar = variant === "header";
  const isCardChrome = variant === "toolbar" || variant === "sidebar";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant={isCardChrome ? "outline" : "secondary"}
          size="sm"
          className={cn(
            "min-h-11 shrink-0 gap-2 sm:min-h-9",
            isCardChrome
              ? cn(
                  "justify-start border-border bg-background px-3 text-foreground hover:bg-muted",
                  variant === "sidebar" && "w-full",
                  variant === "toolbar" && "max-w-full",
                )
              : "min-w-11 bg-white/15 px-3 text-primary-foreground hover:bg-white/25 sm:min-w-0",
            variant === "sidebar" && "sm:min-h-9",
          )}
          aria-label="Account menu"
        >
          <FontAwesomeIcon icon={faUser} className="size-4 shrink-0 opacity-90" />
          <span
            className={cn(
              "max-w-[10rem] truncate",
              isGreenBar && "hidden sm:inline",
              variant === "toolbar" && "hidden md:inline",
              variant === "sidebar" && "inline",
            )}
          >
            {displayName}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={6} className="w-[min(100vw-1rem,16rem)]">
        <div className="px-2 py-1.5 text-xs text-muted-foreground">
          <p className="truncate font-medium text-foreground">{displayName}</p>
          {email ? <p className="truncate">{email}</p> : null}
          {primaryRole ? (
            <p className="mt-1 font-medium text-primary">{primaryRole}</p>
          ) : null}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="min-h-11 cursor-pointer sm:min-h-9">
          <Link href="/settings" className="flex w-full items-center gap-2">
            <FontAwesomeIcon icon={faGear} className="size-4 opacity-80" />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="min-h-11 cursor-pointer gap-2 sm:min-h-9"
          onSelect={(e) => {
            e.preventDefault();
            void logoutAction();
          }}
        >
          <FontAwesomeIcon icon={faRightFromBracket} className="size-4 opacity-80" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
