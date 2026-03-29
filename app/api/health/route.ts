import { NextResponse } from "next/server";

/** Liveness: process is up (no database). */
export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "lab-nexus",
    ts: new Date().toISOString(),
  });
}
