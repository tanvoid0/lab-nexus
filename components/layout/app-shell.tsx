"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faBars,
  faBell,
  faBoxesStacked,
  faCartShopping,
  faClipboardList,
  faDiagramProject,
  faHouse,
  faTruckRampBox,
  faUserShield,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { useCart } from "@/components/providers/cart-provider";
import { effectivePrimaryRole } from "@/lib/auth/roles";
import { AppBreadcrumbs } from "@/components/layout/app-breadcrumbs";
import { BreadcrumbDetailProvider } from "@/components/layout/breadcrumb-detail-context";
import { AppHeaderThemeToggle } from "@/components/layout/app-header-theme-toggle";
import { AppHeaderUserMenu } from "@/components/layout/app-header-user-menu";
import { StaffAssistantPanel } from "@/components/assistant/staff-assistant-panel";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils/cn";

export type AppShellProps = {
  user: {
    id: string;
    email?: string | null;
    name?: string | null;
    roles: string[];
  };
  unreadNotificationCount?: number;
  /** Gemini-backed lab assistant for all signed-in lab roles (toolbar control). */
  labAssistantEnabled?: boolean;
  children: React.ReactNode;
};

type NavItem = {
  href: string;
  label: string;
  icon: IconDefinition;
  badgeCount?: number;
};

function navActive(pathname: string, href: string) {
  if (pathname === href) return true;
  if (href === "/") return false;
  return pathname.startsWith(`${href}/`);
}

function NavBadge({
  count,
  ariaLabel,
}: {
  count: number;
  /** Defaults to “N unread” (notifications). */
  ariaLabel?: string;
}) {
  if (count <= 0) return null;
  return (
    <span
      className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground"
      aria-label={ariaLabel ?? `${count} unread`}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

function CartToolbarLink({
  pathname,
  itemCount,
  cartHydrated,
  variant,
}: {
  pathname: string;
  itemCount: number;
  cartHydrated: boolean;
  variant: "header" | "toolbar";
}) {
  const active = navActive(pathname, "/cart");
  const isHeader = variant === "header";
  const badgeCount = cartHydrated && itemCount > 0 ? itemCount : undefined;
  const label =
    badgeCount != null
      ? `Cart, ${badgeCount} item${badgeCount === 1 ? "" : "s"}`
      : "Cart";

  return (
    <Button
      asChild
      variant={isHeader ? "secondary" : "outline"}
      size="icon"
      className={cn(
        "relative shrink-0",
        isHeader &&
          "h-11 w-11 bg-white/15 text-primary-foreground hover:bg-white/25 sm:h-9 sm:w-9",
        !isHeader &&
          active &&
          "border-primary bg-primary/10 text-primary shadow-sm",
        isHeader && active && "ring-2 ring-white/35 ring-offset-0",
      )}
    >
      <Link
        href="/cart"
        className="flex items-center justify-center"
        aria-label={label}
        aria-current={active ? "page" : undefined}
      >
        <span className="relative inline-flex items-center justify-center">
          <FontAwesomeIcon icon={faCartShopping} className="size-4 opacity-90" />
          {badgeCount != null ? (
            <NavBadge
              count={badgeCount}
              ariaLabel={`${badgeCount} item${badgeCount === 1 ? "" : "s"} in cart`}
            />
          ) : null}
        </span>
      </Link>
    </Button>
  );
}

function DesktopSidebarNav({
  items,
  pathname,
}: {
  items: NavItem[];
  pathname: string;
}) {
  return (
    <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-3" aria-label="Main">
      {items.map((item) => {
        const active = navActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-primary/10 text-primary"
                : "text-foreground hover:bg-muted",
            )}
          >
            <span className="relative inline-flex w-5 justify-center">
              <FontAwesomeIcon icon={item.icon} className="size-4 opacity-90" />
              {item.badgeCount != null ? (
                <NavBadge count={item.badgeCount} />
              ) : null}
            </span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function MobileSheetNav({
  items,
  onNavigate,
}: {
  items: NavItem[];
  onNavigate: () => void;
}) {
  return (
    <nav className="flex flex-col gap-1 px-3 pb-4 pt-1" aria-label="Main">
      {items.map((item) => (
        <SheetClose key={item.href} asChild>
          <Link
            href={item.href}
            onClick={onNavigate}
            className="flex min-h-12 items-center gap-3 rounded-lg px-3 py-2.5 text-base font-medium text-foreground transition-colors hover:bg-muted active:bg-muted/80"
          >
            <span className="relative inline-flex w-6 justify-center">
              <FontAwesomeIcon icon={item.icon} className="size-5 text-primary opacity-90" />
              {item.badgeCount != null ? <NavBadge count={item.badgeCount} /> : null}
            </span>
            {item.label}
          </Link>
        </SheetClose>
      ))}
    </nav>
  );
}

function BrandLogoLink({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn("flex min-w-0 items-center gap-2.5 font-semibold", className)}
    >
      <span className="relative block size-9 shrink-0">
        <Image
          src="/logo.svg"
          alt=""
          fill
          className="object-contain brightness-0 invert"
          sizes="36px"
          priority
        />
      </span>
      <span className="min-w-0 leading-tight">Lab Nexus</span>
    </Link>
  );
}

export function AppShell({
  user,
  unreadNotificationCount = 0,
  labAssistantEnabled = false,
  children,
}: AppShellProps) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const primary = effectivePrimaryRole(user.roles);
  const displayName = user.name || user.email || "Account";
  const { itemCount, hydrated: cartHydrated } = useCart();

  const navItems: NavItem[] = [
    { href: "/", label: "Home", icon: faHouse },
    { href: "/inventory", label: "Inventory", icon: faBoxesStacked },
    { href: "/requests", label: "Loan requests", icon: faTruckRampBox },
    { href: "/checkouts", label: "Checkouts", icon: faClipboardList },
    { href: "/projects", label: "Projects", icon: faDiagramProject },
    {
      href: "/notifications",
      label: "Notifications",
      icon: faBell,
      badgeCount: unreadNotificationCount,
    },
    { href: "/admin", label: "Admin", icon: faUserShield },
  ];

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync sheet to route
    setMobileNavOpen(false);
  }, [pathname]);

  const userMenuProps = {
    displayName,
    email: user.email,
    primaryRole: primary,
  };

  return (
    <div className="flex min-h-full flex-col bg-background md:flex-row">
      {/* Desktop: persistent sidebar */}
      <aside
        className="hidden h-screen w-56 shrink-0 flex-col border-r border-border bg-card md:sticky md:top-0 md:flex"
        aria-label="App navigation"
      >
        <div className="flex h-14 shrink-0 items-center border-b border-border bg-primary px-4 text-primary-foreground">
          <BrandLogoLink />
        </div>
        <DesktopSidebarNav items={navItems} pathname={pathname} />
      </aside>

      <BreadcrumbDetailProvider>
        <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile: top bar + overlay sheet (larger tap targets, slide-over) */}
        <header className="shrink-0 border-b border-border bg-primary text-primary-foreground md:hidden">
          <div className="flex h-14 items-center gap-2 px-3">
            <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
              <SheetTrigger asChild>
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="h-11 w-11 shrink-0 bg-white/15 text-primary-foreground hover:bg-white/25"
                  aria-label="Open menu"
                >
                  <FontAwesomeIcon icon={faBars} className="size-5 opacity-90" />
                </Button>
              </SheetTrigger>
              <SheetContent className="w-[min(100vw-0.5rem,22rem)] overflow-y-auto p-0 sm:w-[min(100vw-1rem,22rem)]">
                <div className="border-b border-border bg-primary px-4 py-4 text-primary-foreground">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <SheetTitle className="text-lg font-semibold text-primary-foreground">
                        Navigate
                      </SheetTitle>
                      <p className="mt-1 text-sm text-primary-foreground/85">
                        Choose a section to open in the app.
                      </p>
                    </div>
                    <SheetClose asChild>
                      <Button
                        type="button"
                        variant="secondary"
                        size="icon"
                        className="size-10 shrink-0 bg-white/15 text-primary-foreground hover:bg-white/25"
                        aria-label="Close menu"
                      >
                        <FontAwesomeIcon icon={faXmark} className="size-5" />
                      </Button>
                    </SheetClose>
                  </div>
                </div>
                <MobileSheetNav
                  items={navItems}
                  onNavigate={() => setMobileNavOpen(false)}
                />
              </SheetContent>
            </Sheet>
            <Link
              href="/"
              className="flex min-w-0 flex-1 items-center gap-2.5 font-semibold"
            >
              <span className="relative block size-9 shrink-0">
                <Image
                  src="/logo.svg"
                  alt=""
                  fill
                  className="object-contain brightness-0 invert"
                  sizes="36px"
                />
              </span>
              <span className="min-w-0 truncate">Lab Nexus</span>
            </Link>
            <div className="flex shrink-0 items-center gap-2">
              <CartToolbarLink
                pathname={pathname}
                itemCount={itemCount}
                cartHydrated={cartHydrated}
                variant="header"
              />
              {labAssistantEnabled ? (
                <StaffAssistantPanel userId={user.id} />
              ) : null}
              <AppHeaderThemeToggle variant="header" />
              <AppHeaderUserMenu {...userMenuProps} variant="header" />
            </div>
          </div>
        </header>

        <div className="sticky top-0 z-30 hidden shrink-0 border-b border-border bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 md:block">
          <div className="mx-auto flex h-14 w-full max-w-6xl min-w-0 items-center gap-3 px-4 2xl:px-8">
            <AppBreadcrumbs className="min-w-0 flex-1 overflow-hidden" />
            <div className="flex shrink-0 items-center gap-2">
              <CartToolbarLink
                pathname={pathname}
                itemCount={itemCount}
                cartHydrated={cartHydrated}
                variant="toolbar"
              />
              {labAssistantEnabled ? (
                <StaffAssistantPanel userId={user.id} />
              ) : null}
              <AppHeaderThemeToggle variant="toolbar" />
              <AppHeaderUserMenu {...userMenuProps} variant="toolbar" />
            </div>
          </div>
        </div>

        <div className="shrink-0 border-b border-border bg-muted/30 px-3 py-2 md:hidden">
          <AppBreadcrumbs />
        </div>

        <main className="mx-auto w-full max-w-6xl flex-1 px-3 py-6 sm:px-4 sm:py-8 2xl:px-8">
          {children}
        </main>
        </div>
      </BreadcrumbDetailProvider>
    </div>
  );
}
