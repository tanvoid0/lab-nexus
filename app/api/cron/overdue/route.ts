import { markOverdueCheckouts } from "@/lib/actions/overdue";
import { rateLimit } from "@/lib/rate-limit";
import { NextResponse } from "next/server";

function clientIp(req: Request) {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

/**
 * Call on a schedule (Vercel Cron, system cron, etc.):
 * GET /api/cron/overdue
 * Header: Authorization: Bearer $CRON_SECRET
 */
export async function GET(req: Request) {
  const ip = clientIp(req);
  const burst = rateLimit(`cron-burst:${ip}`, 30, 60_000);
  if (!burst.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured" },
      { status: 503 },
    );
  }
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    const fail = rateLimit(`cron-fail:${ip}`, 20, 15 * 60_000);
    if (!fail.ok) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const count = await markOverdueCheckouts();
  return NextResponse.json({ updated: count });
}
