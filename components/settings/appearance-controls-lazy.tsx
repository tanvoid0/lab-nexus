"use client";

import dynamic from "next/dynamic";

export const AppearanceControlsLazy = dynamic(
  () =>
    import("@/components/settings/appearance-controls").then((m) => ({
      default: m.AppearanceControls,
    })),
  {
    ssr: false,
    loading: () => (
      <p className="text-sm text-muted-foreground">Loading appearance…</p>
    ),
  },
);
