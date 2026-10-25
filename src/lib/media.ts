import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export function sniffImageMime(buffer: Buffer) {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "image/jpeg";
  if (buffer.length >= 8 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return "image/png";
  }
  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }
  if (buffer.length >= 6 && buffer.toString("ascii", 0, 3) === "GIF") return "image/gif";
  return null;
}

export function validateImage(buffer: Buffer, declaredType: string | null) {
  if (buffer.length > 8 * 1024 * 1024) {
    throw new Error("Image must be 8MB or smaller");
  }
  const sniffed = sniffImageMime(buffer);
  if (!sniffed || !ALLOWED.has(sniffed)) {
    throw new Error("Only JPEG, PNG, WEBP, and GIF images are allowed");
  }
  if (declaredType && declaredType !== "application/octet-stream" && declaredType !== sniffed) {
    if (!ALLOWED.has(declaredType)) {
      throw new Error("Invalid image content type");
    }
  }
  return sniffed;
}

export function mediaUrl(storedImageId: string) {
  return `/api/media/${storedImageId}`;
}

export function databaseSetupHint(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (
    message.includes("StoredImage") ||
    message.includes("storedImageId") ||
    message.includes("does not exist") ||
    message.includes("P2021") ||
    message.includes("P2022")
  ) {
    return "Database needs the image tables. In the project folder run: npx prisma migrate deploy";
  }
  return null;
}

type Db = Prisma.TransactionClient | typeof prisma;

export async function createStoredImage(
  db: Db,
  buffer: Buffer,
  mimeType: string,
  width?: number,
  height?: number,
) {
  return db.storedImage.create({
    data: {
      mimeType,
      data: new Uint8Array(buffer),
      width: width ?? null,
      height: height ?? null,
    },
  });
}

export async function attachProductImage(db: Db, productId: string, buffer: Buffer, mimeType: string) {
  const stored = await createStoredImage(db, buffer, mimeType);
  const count = await db.productImage.count({ where: { productId } });
  const image = await db.productImage.create({
    data: {
      productId,
      storedImageId: stored.id,
      publicId: null,
      url: mediaUrl(stored.id),
      sortOrder: count,
    },
  });
  return { stored, image };
}

export async function deleteStoredImage(storedImageId: string) {
  await prisma.storedImage.deleteMany({ where: { id: storedImageId } });
}
