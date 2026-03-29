"use server";

import { auth } from "@/auth";
import { updateTag } from "next/cache";
import { userSettingsPatchSchema } from "@/lib/schemas/user-settings";
import {
  getCachedUserSettings,
  getPrismaUserSettingsDelegate,
  userSettingsCacheTag,
} from "@/lib/settings/cache";
import { DEFAULT_USER_SETTINGS } from "@/lib/settings/defaults";
import type { UserSettingsPublic } from "@/lib/settings/types";

export async function fetchUserSettingsAction(options?: {
  /** When true, invalidates the server data cache before reading (e.g. settings page). */
  revalidate?: boolean;
}): Promise<UserSettingsPublic | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  const userId = session.user.id;
  if (options?.revalidate) {
    updateTag(userSettingsCacheTag(userId));
  }
  return getCachedUserSettings(userId);
}

export async function saveUserSettingsAction(
  patch: unknown,
): Promise<{ ok: true; settings: UserSettingsPublic } | { ok: false; error: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "Sign in required." };
  }
  const parsed = userSettingsPatchSchema.safeParse(patch);
  if (!parsed.success) {
    return { ok: false, error: "Invalid settings." };
  }
  const userId = session.user.id;
  const settingsDb = getPrismaUserSettingsDelegate();
  if (!settingsDb) {
    return {
      ok: false,
      error:
        "Settings storage is unavailable. Regenerate the Prisma client (stop dev server, run pnpm db:generate, then pnpm db:push if needed) and restart.",
    };
  }
  const row = await settingsDb.findUnique({ where: { userId } });
  const base: UserSettingsPublic = row
    ? {
        theme:
          row.theme === "dark" || row.theme === "light" || row.theme === "system"
            ? row.theme
            : DEFAULT_USER_SETTINGS.theme,
        density:
          row.density === "compact" || row.density === "comfortable"
            ? row.density
            : DEFAULT_USER_SETTINGS.density,
      }
    : DEFAULT_USER_SETTINGS;
  const next: UserSettingsPublic = {
    theme: parsed.data.theme ?? base.theme,
    density: parsed.data.density ?? base.density,
  };

  await settingsDb.upsert({
    where: { userId },
    create: {
      userId,
      theme: next.theme,
      density: next.density,
    },
    update: {
      theme: next.theme,
      density: next.density,
    },
  });

  updateTag(userSettingsCacheTag(userId));
  return { ok: true, settings: next };
}
