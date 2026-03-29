import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { getClientIpFromRequest } from "@/lib/request-ip";

/** One-minute window fixed buckets (in-memory, per Node process). */
export const RATE_WINDOW_MS = 60_000;

/** Public liveness: generous for orchestrators, still caps abuse. */
export const HEALTH_LIVENESS_MAX_PER_IP = 120;

/** Readiness hits the DB — slightly tighter. */
export const HEALTH_READY_MAX_PER_IP = 90;

/** QR PNG generation is CPU-heavy. */
export const QR_IMAGE_MAX_PER_IP = 60;

/** Shared cap across Lab assistant HTTP routes (per IP). */
export const ASSISTANT_HTTP_MAX_PER_IP = 200;

export function tooManyRequestsResponse(retryAfterMs: number) {
  return NextResponse.json(
    { error: "Too many requests" },
    {
      status: 429,
      headers: {
        "Retry-After": String(Math.max(1, Math.ceil(retryAfterMs / 1000))),
      },
    },
  );
}

/**
 * Per-IP fixed-window limit. Returns a 429 response when over budget, otherwise `null`.
 */
export function rateLimitIpOr429(
  req: Request,
  bucketKey: string,
  max: number,
  windowMs: number,
): NextResponse | null {
  const ip = getClientIpFromRequest(req);
  const lim = rateLimit(`${bucketKey}:${ip}`, max, windowMs);
  if (lim.ok) return null;
  return tooManyRequestsResponse(lim.retryAfterMs);
}
