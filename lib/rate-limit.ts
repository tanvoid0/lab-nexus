/**
 * Simple in-memory fixed window rate limiter (per Node process).
 * Suitable for login throttling on a single instance; use Redis for multi-instance production.
 */
const buckets = new Map<string, number[]>();

export function rateLimit(
  key: string,
  max: number,
  windowMs: number,
): { ok: true } | { ok: false; retryAfterMs: number } {
  const now = Date.now();
  const windowStart = now - windowMs;
  let stamps = buckets.get(key);
  if (!stamps) {
    stamps = [];
    buckets.set(key, stamps);
  }
  const fresh = stamps.filter((t) => t > windowStart);
  if (fresh.length >= max) {
    const oldest = Math.min(...fresh);
    return { ok: false, retryAfterMs: windowMs - (now - oldest) };
  }
  fresh.push(now);
  buckets.set(key, fresh);
  return { ok: true };
}
