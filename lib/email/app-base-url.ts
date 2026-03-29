/**
 * Absolute app origin for links in outbound email. Prefer a stable public URL in production.
 */
export function getAppBaseUrlForEmail(): string | null {
  const explicit =
    process.env.NEXTAUTH_URL?.trim() ||
    process.env.AUTH_URL?.trim() ||
    process.env.APP_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel.replace(/^https?:\/\//, "").replace(/\/$/, "")}`;
  return null;
}

export function absoluteUrl(path: string): string | null {
  const base = getAppBaseUrlForEmail();
  if (!base) return null;
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}
