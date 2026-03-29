import { resolveAppOriginForPublicUrl } from "@/lib/request-origin";

/**
 * Build `https://current-host/...` for QR payloads and share links. New entity types should compose
 * their **app path** (e.g. `/scan/...`, future `/x/...`) and pass it here—host follows the request
 * or env (see `lib/request-origin.ts`).
 */
export async function absoluteUrlForAppPath(path: string): Promise<string | null> {
  const p = path.startsWith("/") ? path : `/${path}`;
  const base = await resolveAppOriginForPublicUrl();
  if (!base) return null;
  return `${base.replace(/\/$/, "")}${p}`;
}
