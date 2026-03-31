import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import { DEFAULT_USER_SETTINGS } from "@/lib/settings/defaults";
import { USER_SETTINGS_SERVER_CACHE_SECONDS } from "@/lib/settings/constants";
import type { DensityPreference, ThemePreference, UserSettingsPublic } from "@/lib/settings/types";

export function userSettingsCacheTag(userId: string) {
  return `user-settings:${userId}`;
}

function normalizeTheme(v: string | null | undefined): ThemePreference {
  return v === "dark" || v === "light" || v === "system" ? v : DEFAULT_USER_SETTINGS.theme;
}

function normalizeDensity(v: string | null | undefined): DensityPreference {
  return v === "compact" || v === "comfortable" ? v : DEFAULT_USER_SETTINGS.density;
}

/** Stale `node_modules` / dev server lock can leave the client without this delegate until `pnpm db:generate`. */
type UserSettingsRow = { theme: string; density: string };

export type PrismaUserSettingsDelegate = {
  findUnique: (args: { where: { userId: string } }) => Promise<UserSettingsRow | null>;
  upsert: (args: {
    where: { userId: string };
    create: { userId: string; theme: string; density: string };
    update: { theme: string; density: string };
  }) => Promise<unknown>;
};

export function getPrismaUserSettingsDelegate(): PrismaUserSettingsDelegate | null {
  const delegate = (prisma as unknown as { userSettings?: PrismaUserSettingsDelegate }).userSettings;
  if (
    delegate &&
    typeof delegate.findUnique === "function" &&
    typeof delegate.upsert === "function"
  ) {
    return delegate;
  }
  if (process.env.NODE_ENV === "development") {
    console.warn(
      "[vehicle-computing-lab] Prisma client is missing `userSettings`. Stop the dev server, run `pnpm db:generate`, run `pnpm db:push` if you added UserSettings to the schema, then restart.",
    );
  }
  return null;
}

async function loadUserSettingsFromDb(userId: string): Promise<UserSettingsPublic> {
  const delegate = getPrismaUserSettingsDelegate();
  if (!delegate) return DEFAULT_USER_SETTINGS;
  const row = await delegate.findUnique({ where: { userId } });
  if (!row) return DEFAULT_USER_SETTINGS;
  return {
    theme: normalizeTheme(row.theme),
    density: normalizeDensity(row.density),
  };
}

export async function getCachedUserSettings(userId: string): Promise<UserSettingsPublic> {
  return unstable_cache(
    () => loadUserSettingsFromDb(userId),
    ["user-settings", userId],
    {
      revalidate: USER_SETTINGS_SERVER_CACHE_SECONDS,
      tags: [userSettingsCacheTag(userId)],
    },
  )();
}
