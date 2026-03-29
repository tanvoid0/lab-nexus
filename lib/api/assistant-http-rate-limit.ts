import type { NextResponse } from "next/server";
import {
  ASSISTANT_HTTP_MAX_PER_IP,
  RATE_WINDOW_MS,
  rateLimitIpOr429,
} from "@/lib/api/rate-limit-http";

/** Shared per-IP budget for `/api/assistant/*` handlers (in-memory, per process). */
export function assistantHttpRateLimit(req: Request): NextResponse | null {
  return rateLimitIpOr429(
    req,
    "api:assistant",
    ASSISTANT_HTTP_MAX_PER_IP,
    RATE_WINDOW_MS,
  );
}
