import { headers } from "next/headers";
import { getAppBaseUrlForEmail } from "@/lib/email/app-base-url";

/**
 * Public origin for the current HTTP request (`https://tenant.example.com`).
 * Uses forwarded headers when behind a proxy. Prefer this for QR and share links so each
 * deployment domain (staging, prod, localhost) encodes correctly without changing env.
 */
export async function getRequestAppOrigin(): Promise<string | null> {
  try {
    const h = await headers();
    const hostRaw = h.get("x-forwarded-host") ?? h.get("host");
    if (!hostRaw) return null;
    const host = hostRaw.split(",")[0]!.trim();
    if (!host) return null;

    const protoRaw = h.get("x-forwarded-proto");
    const protoFirst = protoRaw?.split(",")[0]?.trim().toLowerCase();
    const local =
      host.startsWith("localhost:") ||
      host === "localhost" ||
      host.startsWith("127.0.0.1");

    const scheme =
      protoFirst === "http" || protoFirst === "https"
        ? protoFirst
        : local
          ? "http"
          : "https";

    return `${scheme}://${host}`;
  } catch {
    return null;
  }
}

/**
 * Origin for absolute URLs shown to users / encoded in QRs: live request host first,
 * then `NEXTAUTH_URL` / `APP_URL` / `VERCEL_URL` (stable for email and non-request contexts).
 */
export async function resolveAppOriginForPublicUrl(): Promise<string | null> {
  const fromRequest = await getRequestAppOrigin();
  if (fromRequest) return fromRequest.replace(/\/$/, "");
  return getAppBaseUrlForEmail();
}
