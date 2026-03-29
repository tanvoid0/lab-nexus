import QRCode from "qrcode";
import { NextRequest, NextResponse } from "next/server";

/** Generate a QR PNG for a URL (e.g. link to `/scan/{trackTag}`). */
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url?.trim()) {
    return NextResponse.json({ error: "Missing url query" }, { status: 400 });
  }
  try {
    const png = await QRCode.toBuffer(url, { type: "png", width: 256, margin: 1 });
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
