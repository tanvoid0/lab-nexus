import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

type UploadLike = {
  name: string;
  type: string;
  size: number;
  arrayBuffer(): Promise<ArrayBuffer>;
};

function assertValidImage(file: UploadLike) {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new Error("Invalid image type");
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("Image too large (max 5MB)");
  }
}

function extensionForUpload(file: Pick<UploadLike, "name" | "type">): string {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && fromName !== file.name.toLowerCase()) {
    return fromName;
  }

  switch (file.type) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    default:
      return "bin";
  }
}

export async function persistUploadedImage(
  file: UploadLike | null | undefined,
): Promise<string | undefined> {
  if (!file || file.size === 0) return undefined;

  assertValidImage(file);

  const ext = extensionForUpload(file);
  const name = `${Date.now()}-${randomBytes(8).toString("hex")}.${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });

  const buf = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, name), buf);
  return `/uploads/${name}`;
}

function slugifyFileStem(value: string): string {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "inventory-seed-image";
}

export function buildSyntheticSeedImageUrl(seed: string): string {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/960/720.webp`;
}

export async function persistImageFromUrl(
  url: string,
  fileStem: string,
): Promise<string | undefined> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Image fetch failed (${res.status})`);
  }

  const type = res.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase() || "";
  const buf = Buffer.from(await res.arrayBuffer());

  return persistUploadedImage({
    name: `${slugifyFileStem(fileStem)}.${extensionForUpload({ name: "", type })}`,
    type,
    size: buf.byteLength,
    arrayBuffer: async () => buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength),
  });
}
