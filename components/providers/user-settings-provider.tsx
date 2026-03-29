"use client";

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTheme } from "next-themes";
import {
  fetchUserSettingsAction,
  saveUserSettingsAction,
} from "@/lib/actions/user-settings";
import { USER_SETTINGS_CLIENT_TTL_MS } from "@/lib/settings/constants";
import { writeDensityPreference } from "@/lib/settings/client-prefs";
import type { UserSettingsPublic } from "@/lib/settings/types";

type UserSettingsContextValue = {
  settings: UserSettingsPublic;
  isSaving: boolean;
  refresh: (opts?: {
    force?: boolean;
    revalidateServerCache?: boolean;
  }) => Promise<void>;
  updateSettings: (patch: Partial<UserSettingsPublic>) => Promise<void>;
};

const UserSettingsContext = createContext<UserSettingsContextValue | null>(null);

function applyUserSettingsToDocument(
  s: UserSettingsPublic,
  setTheme: (t: string) => void,
) {
  setTheme(s.theme);
  writeDensityPreference(s.density);
}

export function UserSettingsProvider({
  initialTheme,
  initialDensity,
  children,
}: {
  initialTheme: UserSettingsPublic["theme"];
  initialDensity: UserSettingsPublic["density"];
  children: React.ReactNode;
}) {
  const { setTheme } = useTheme();
  const [settings, setSettings] = useState<UserSettingsPublic>(() => ({
    theme: initialTheme,
    density: initialDensity,
  }));
  const [isSaving, setIsSaving] = useState(false);
  const loadedAtRef = useRef(0);

  useLayoutEffect(() => {
    const next = { theme: initialTheme, density: initialDensity };
    setSettings(next);
    applyUserSettingsToDocument(next, setTheme);
    loadedAtRef.current = Date.now();
  }, [initialTheme, initialDensity, setTheme]);

  const refresh = useCallback(
    async (opts?: { force?: boolean; revalidateServerCache?: boolean }) => {
      const stale =
        Date.now() - loadedAtRef.current > USER_SETTINGS_CLIENT_TTL_MS;
      if (!opts?.force && !stale) return;
      const data = await fetchUserSettingsAction({
        revalidate: opts?.revalidateServerCache ?? false,
      });
      if (data) {
        setSettings(data);
        applyUserSettingsToDocument(data, setTheme);
        loadedAtRef.current = Date.now();
      }
    },
    [setTheme],
  );

  const updateSettings = useCallback(
    async (patch: Partial<UserSettingsPublic>) => {
      setIsSaving(true);
      try {
        const res = await saveUserSettingsAction(patch);
        if (res.ok) {
          setSettings(res.settings);
          applyUserSettingsToDocument(res.settings, setTheme);
          loadedAtRef.current = Date.now();
        }
      } finally {
        setIsSaving(false);
      }
    },
    [setTheme],
  );

  const value = useMemo(
    () => ({ settings, isSaving, refresh, updateSettings }),
    [settings, isSaving, refresh, updateSettings],
  );

  return (
    <UserSettingsContext.Provider value={value}>
      {children}
    </UserSettingsContext.Provider>
  );
}

export function useUserSettings() {
  const ctx = useContext(UserSettingsContext);
  if (!ctx) {
    throw new Error("useUserSettings must be used within UserSettingsProvider");
  }
  return ctx;
}
