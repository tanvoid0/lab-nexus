"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleHalfStroke,
  faMoon,
  faSun,
} from "@fortawesome/free-solid-svg-icons";
import { useUserSettings } from "@/components/providers/user-settings-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

type ThemePref = "light" | "dark" | "system";

const CYCLE: ThemePref[] = ["light", "dark", "system"];

function normalizeTheme(t: string | undefined): ThemePref {
  if (t === "dark" || t === "light" || t === "system") return t;
  return "light";
}

type AppHeaderThemeToggleProps = {
  /** `header` = primary mobile bar; `toolbar` = desktop sticky bar */
  variant?: "header" | "toolbar";
};

export function AppHeaderThemeToggle({
  variant = "toolbar",
}: AppHeaderThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const { updateSettings } = useUserSettings();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- defer icon to client; avoids next-themes hydration mismatch
    setMounted(true);
  }, []);

  const pref = normalizeTheme(theme);
  const icon = !mounted
    ? faCircleHalfStroke
    : pref === "dark"
      ? faMoon
      : pref === "system"
        ? faCircleHalfStroke
        : faSun;
  const label = !mounted
    ? "Theme"
    : pref === "dark"
      ? "Dark theme (click for system)"
      : pref === "system"
        ? "System theme (click for light)"
        : "Light theme (click for dark)";

  const cycle = () => {
    const i = CYCLE.indexOf(pref);
    const next = CYCLE[(i + 1) % CYCLE.length]!;
    setTheme(next);
    void updateSettings({ theme: next });
  };

  const isHeader = variant === "header";

  return (
    <Button
      type="button"
      variant={isHeader ? "secondary" : "outline"}
      size="icon"
      className={cn(
        "shrink-0",
        isHeader &&
          "h-11 w-11 bg-white/15 text-primary-foreground hover:bg-white/25 sm:h-9 sm:w-9",
      )}
      aria-label={label}
      onClick={() => cycle()}
    >
      <FontAwesomeIcon icon={icon} className="size-4 opacity-90" />
    </Button>
  );
}
