import { NextResponse } from "next/server";
import {
  HEALTH_LIVENESS_MAX_PER_IP,
  RATE_WINDOW_MS,
  rateLimitIpOr429,
} from "@/lib/api/rate-limit-http";
import { assistantHealthStatus } from "@/lib/health/assistant-status";

/** Liveness: process is up (no database). */
export async function GET(req: Request) {
  const limited = rateLimitIpOr429(
    req,
    "health:liveness",
    HEALTH_LIVENESS_MAX_PER_IP,
    RATE_WINDOW_MS,
  );
  if (limited) return limited;

  return NextResponse.json({
    ok: true,
    service: "lab-nexus",
    ts: new Date().toISOString(),
    ...assistantHealthStatus(),
  });
}
