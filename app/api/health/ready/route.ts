import { NextResponse } from "next/server";
import {
  HEALTH_READY_MAX_PER_IP,
  RATE_WINDOW_MS,
  rateLimitIpOr429,
} from "@/lib/api/rate-limit-http";
import { assistantHealthStatus } from "@/lib/health/assistant-status";
import { prisma } from "@/lib/db";

/** Readiness: MongoDB reachable via Prisma. */
export async function GET(req: Request) {
  const limited = rateLimitIpOr429(
    req,
    "health:ready",
    HEALTH_READY_MAX_PER_IP,
    RATE_WINDOW_MS,
  );
  if (limited) return limited;

  try {
    await prisma.$runCommandRaw({ ping: 1 });
    return NextResponse.json({
      ok: true,
      db: true,
      ts: new Date().toISOString(),
      ...assistantHealthStatus(),
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        db: false,
        ts: new Date().toISOString(),
        ...assistantHealthStatus(),
      },
      { status: 503 },
    );
  }
}
