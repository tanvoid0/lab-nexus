import { NextRequest, NextResponse } from "next/server";
import {
  QR_IMAGE_MAX_PER_IP,
  RATE_WINDOW_MS,
  rateLimitIpOr429,
} from "@/lib/api/rate-limit-http";
import { generateQrCodePngBuffer } from "@/lib/qr/generate-png";

/** Generate a QR PNG for any absolute URL (`lib/qr` + entity-specific `*-target.ts` build the payload). */
export async function GET(req: NextRequest) {
  const limited = rateLimitIpOr429(
    req,
    "api:qr",
    QR_IMAGE_MAX_PER_IP,
    RATE_WINDOW_MS,
  );
  if (limited) return limited;

  const url = req.nextUrl.searchParams.get("url");
  if (!url?.trim()) {
    return NextResponse.json({ error: "Missing url query" }, { status: 400 });
  }
  try {
    const png = await generateQrCodePngBuffer(url);
    return new NextResponse(new Uint8Array(png), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return NextResponse.json({ error: "QR generation failed" }, { status: 500 });
  }
}
