"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleHalfStroke, faMoon, faSun } from "@fortawesome/free-solid-svg-icons";
import { useUserSettings } from "@/components/providers/user-settings-provider";
import { Label } from "@/components/ui/label";
import {
  DENSITY_STORAGE_KEY,
  applyStoredDensityClass,
  writeDensityPreference,
} from "@/lib/settings/client-prefs";
import { nativeSelectClassName } from "@/lib/form/native-field-classes";

export function AppearanceControls() {
  const { settings, updateSettings, refresh } = useUserSettings();
  const { theme, setTheme, resolvedTheme } = useTheme();

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === DENSITY_STORAGE_KEY) {
        applyStoredDensityClass();
        void refresh({ force: true });
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [refresh]);

  return (
    <div className="space-6">
      <div className="space-y-2">
        <Label htmlFor="theme">Theme</Label>
        <select
          id="theme"
          className={nativeSelectClassName("h-11 sm:h-10")}
          value={
            theme === "system"
              ? "system"
              : theme === "dark"
                ? "dark"
                : "light"
          }
          onChange={(e) => {
            const v = e.target.value;
            if (v === "light" || v === "dark" || v === "system") {
              setTheme(v);
              void updateSettings({ theme: v });
            }
          }}
        >
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="system">System</option>
        </select>
        <p className="text-xs text-muted-foreground">
          {resolvedTheme === "dark" ? (
            <span className="inline-flex items-center gap-1.5">
              <FontAwesomeIcon icon={faMoon} className="size-3.5" />
              Dark is active
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5">
              <FontAwesomeIcon icon={faSun} className="size-3.5" />
              Light is active
            </span>
          )}
          {theme === "system" ? (
            <>
              {" "}
              <span className="inline-flex items-center gap-1">
                (<FontAwesomeIcon icon={faCircleHalfStroke} className="size-3" />
                following system)
              </span>
            </>
          ) : null}
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="density">List density</Label>
        <select
          id="density"
          className={nativeSelectClassName("h-11 sm:h-10")}
          value={settings.density}
          onChange={(e) => {
            const v = e.target.value === "compact" ? "compact" : "comfortable";
            writeDensityPreference(v);
            void updateSettings({ density: v });
          }}
        >
          <option value="comfortable">Comfortable</option>
          <option value="compact">Compact</option>
        </select>
        <p className="text-xs text-muted-foreground">
          Affects table spacing on inventory and similar lists.
        </p>
      </div>
    </div>
  );
}
