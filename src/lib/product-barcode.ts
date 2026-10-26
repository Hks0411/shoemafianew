import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export function normalizeBarcode(raw?: string | null): string | null {
  const trimmed = raw?.trim();
  return trimmed ? trimmed : null;
}

export function duplicateBarcodesInList(barcodes: (string | null)[]): string | null {
  const used = barcodes.filter((b): b is string => Boolean(b));
  const seen = new Set<string>();
  for (const code of used) {
    if (seen.has(code)) return code;
    seen.add(code);
  }
  return null;
}

export async function findBarcodeConflict(
  barcodes: (string | null)[],
  excludeVariationIds: string[] = [],
): Promise<string | null> {
  for (const barcode of barcodes) {
    if (!barcode) continue;
    const row = await prisma.productVariation.findFirst({
      where: {
        barcode,
        ...(excludeVariationIds.length ? { id: { notIn: excludeVariationIds } } : {}),
      },
      select: { barcode: true, product: { select: { name: true } } },
    });
    if (row?.barcode) {
      return `Barcode “${row.barcode}” is already used on “${row.product.name}”. Change it or leave barcode empty.`;
    }
  }
  return null;
}

export function formatProductSaveError(error: unknown): string {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    const target = String(error.meta?.target ?? "");
    if (target.includes("barcode")) {
      return "That barcode is already used on another size or product. Enter a unique barcode or leave it blank.";
    }
    return "A unique field conflict occurred. Check barcodes and item codes.";
  }
  return error instanceof Error ? error.message : "Could not save product";
}
