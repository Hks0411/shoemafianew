import type { ImportMode, Prisma } from "@prisma/client";
import { upsertCategoryByName } from "@/lib/categories";
import {
  displayProductName,
  groupingKey,
  stableParentCode,
  stripSizeSuffix,
  type ParsedRow,
} from "@/lib/import/group";
import { uniqueSlug } from "@/lib/slug";

export async function findExistingVariation(
  tx: Prisma.TransactionClient,
  barcode: string,
  sku: string,
  itemCode: string,
  size: string,
) {
  if (barcode) {
    const byBarcode = await tx.productVariation.findFirst({
      where: { barcode },
      include: { product: true },
    });
    if (byBarcode) return byBarcode;
  }
  if (sku) {
    const bySku = await tx.productVariation.findFirst({
      where: { sku },
      include: { product: true },
    });
    if (bySku) return bySku;
  }
  if (itemCode && size) {
    const parentItemCode = stripSizeSuffix(itemCode, size) || itemCode;
    const byParent = await tx.product.findFirst({
      where: { itemCode: parentItemCode },
      include: { variations: true },
    });
    const match = byParent?.variations.find((variation) => variation.size === size);
    if (match && byParent) return { ...match, product: byParent };
  }
  return null;
}

export async function applyMappedRow(
  tx: Prisma.TransactionClient,
  row: ParsedRow,
  mode: ImportMode,
  jobId: string,
): Promise<"skipped" | "created" | "updated"> {
  if (row.issues.length) throw new Error(row.issues.join("; "));
  const decision = groupingKey(row);
  if (decision.kind === "review") throw new Error(decision.reason);

  const existing = await findExistingVariation(tx, row.barcode, row.sku, row.itemCode, row.size || "OS");
  if (existing && mode === "CREATE_ONLY") return "skipped";
  if (!existing && mode === "UPDATE_MATCHING") return "skipped";

  const size = row.size || "OS";
  const price = row.price ?? (existing ? Number(existing.price) : null);
  if (price == null) throw new Error("Price is required for new products");
  const stock = row.stock ?? existing?.stock ?? 0;
  const name = displayProductName(row, size) || existing?.product.name || row.name;
  if (!name) throw new Error("Product name is required");
  const categoryId = row.category ? await upsertCategoryByName(tx, row.category) : null;

  if (existing) {
    const reserved = existing.reserved;
    await tx.productVariation.update({
      where: { id: existing.id },
      data: {
        sku: row.sku || existing.sku,
        barcode: row.barcode || existing.barcode,
        price,
        salePrice: row.salePrice,
        stock,
        available: Math.max(0, stock - reserved),
      },
    });
    await tx.product.update({
      where: { id: existing.productId },
      data: {
        name,
        description: row.description || existing.product.description,
        itemCode: stableParentCode(row, size) || existing.product.itemCode,
        ...(categoryId ? { categoryId } : {}),
      },
    });
    await tx.inventoryMovement.create({
      data: {
        variationId: existing.id,
        delta: stock - existing.stock,
        reason: "IMPORT",
        note: `Job ${jobId}`,
      },
    });
    return "updated";
  }

  const groupCode = stableParentCode(row, size) || null;
  let parent = groupCode ? await tx.product.findFirst({ where: { itemCode: groupCode }, include: { variations: true } }) : null;

  if (!parent && groupCode) {
    parent = await tx.product.findFirst({
      where: { name, itemCode: groupCode },
      include: { variations: true },
    });
  }

  if (parent) {
    const sameSize = parent.variations.find((variation) => variation.size === size);
    if (sameSize) {
      throw new Error(
        `Size ${size} already exists on item ${groupCode} with a different barcode. Confirm the mapping instead of merging.`,
      );
    }
  }

  if (!parent) {
    const idSeed = `${Date.now()}${row.rowNumber}`;
    parent = await tx.product.create({
      data: {
        name,
        slug: uniqueSlug(name, idSeed),
        description: row.description || "",
        itemCode: groupCode,
        categoryId,
        status: "ACTIVE",
      },
      include: { variations: true },
    });
  } else if (categoryId) {
    await tx.product.update({
      where: { id: parent.id },
      data: { categoryId },
    });
  }

  const created = await tx.productVariation.create({
    data: {
      productId: parent.id,
      size,
      sku: row.sku || null,
      barcode: row.barcode || null,
      price,
      salePrice: row.salePrice,
      stock,
      reserved: 0,
      available: stock,
    },
  });
  await tx.inventoryMovement.create({
    data: {
      variationId: created.id,
      delta: stock,
      reason: "IMPORT",
      note: `Job ${jobId}`,
    },
  });
  return "created";
}
