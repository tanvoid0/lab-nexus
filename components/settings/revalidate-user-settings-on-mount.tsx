"use client";

import { useEffect } from "react";
import { useUserSettings } from "@/components/providers/user-settings-provider";

/** Forces a fresh read from the DB (and server cache revalidation) when the settings page loads. */
export function RevalidateUserSettingsOnMount() {
  const { refresh } = useUserSettings();
  useEffect(() => {
    void refresh({ force: true, revalidateServerCache: true });
  }, [refresh]);
  return null;
}
