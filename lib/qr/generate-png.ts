import QRCode from "qrcode";

/** Shared PNG generation for `GET /api/qr` and any future server-side QR output. */
export async function generateQrCodePngBuffer(
  payload: string,
  options?: { width?: number; margin?: number },
): Promise<Buffer> {
  const width = options?.width ?? 256;
  const margin = options?.margin ?? 1;
  return QRCode.toBuffer(payload, { type: "png", width, margin });
}
