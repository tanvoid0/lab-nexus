import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

/** Readiness: MongoDB reachable via Prisma. */
export async function GET() {
  try {
    await prisma.$runCommandRaw({ ping: 1 });
    return NextResponse.json({
      ok: true,
      db: true,
      ts: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      { ok: false, db: false, ts: new Date().toISOString() },
      { status: 503 },
    );
  }
}
