"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

export type ChartTheme = {
  primary: string;
  mutedForeground: string;
  border: string;
  accent: string;
  cardForeground: string;
  destructive: string;
};

const FALLBACK: ChartTheme = {
  primary: "#144733",
  mutedForeground: "#4a5c55",
  border: "#d4e0db",
  accent: "#8b7355",
  cardForeground: "#1a1a1a",
  destructive: "#b91c1c",
};

function readChartTheme(): ChartTheme {
  if (typeof document === "undefined") return FALLBACK;
  const root = document.documentElement;
  const g = (name: string, fb: string) => {
    const v = getComputedStyle(root).getPropertyValue(name).trim();
    return v || fb;
  };
  return {
    primary: g("--primary", FALLBACK.primary),
    mutedForeground: g("--muted-foreground", FALLBACK.mutedForeground),
    border: g("--border", FALLBACK.border),
    accent: g("--accent", FALLBACK.accent),
    cardForeground: g("--card-foreground", FALLBACK.cardForeground),
    destructive: g("--destructive", FALLBACK.destructive),
  };
}

/** Resolved app CSS variables for Recharts (SVG fills need real colors). Re-reads on theme change. */
export function useChartTheme(): ChartTheme {
  const { resolvedTheme } = useTheme();
  const [theme, setTheme] = useState<ChartTheme>(FALLBACK);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- re-read CSS variables when theme class on html changes
    setTheme(readChartTheme());
  }, [resolvedTheme]);

  return theme;
}
