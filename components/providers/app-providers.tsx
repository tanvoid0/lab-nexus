"use client";

import { useLayoutEffect } from "react";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { applyStoredDensityClass } from "@/lib/settings/client-prefs";

export function AppProviders({ children }: { children: React.ReactNode }) {
  useLayoutEffect(() => {
    applyStoredDensityClass();
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      <TooltipProvider delayDuration={400} skipDelayDuration={200}>
        {children}
      </TooltipProvider>
    </ThemeProvider>
  );
}
