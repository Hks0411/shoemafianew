import { NextResponse } from "next/server";
import { z } from "zod";
import { adminOr401 } from "@/lib/auth/guard";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { setVariationStock } from "@/lib/inventory";
import {
  duplicateBarcodesInList,
  findBarcodeConflict,
  formatProductSaveError,
  normalizeBarcode,
} from "@/lib/product-barcode";
const updateSchema = z.object({
  name: z.string().min(1).max(180).optional(),
  description: z.string().max(8000).optional(),
  itemCode: z.string().max(80).optional().nullable(),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).optional(),
  featured: z.boolean().optional(),
  categoryId: z.string().optional().nullable(),
  variations: z
    .array(
      z.object({
        id: z.string().optional(),
        size: z.string().min(1).max(20),
        sku: z.string().max(80).optional().nullable(),
        barcode: z.string().max(80).optional().nullable(),
        price: z.number().nonnegative(),
        salePrice: z.number().nonnegative().optional().nullable(),
        stock: z.number().int().nonnegative(),
      }),
    )
    .optional(),
});

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { admin, response } = await adminOr401();
  if (!admin) return response;
  const { id } = await context.params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: { images: { orderBy: { sortOrder: "asc" } }, variations: true, category: true },
  });
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(product);
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const { admin, response } = await adminOr401();
  if (!admin) return response;
  const { id } = await context.params;
  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid product update" }, { status: 400 });

  const existing = await prisma.product.findUnique({ where: { id }, include: { variations: true } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (parsed.data.variations) {
    const normalized = parsed.data.variations.map((v) => ({
      ...v,
      barcode: normalizeBarcode(v.barcode),
      sku: v.sku?.trim() || null,
    }));
    const barcodes = normalized.map((v) => v.barcode);
    const dup = duplicateBarcodesInList(barcodes);
    if (dup) {
      return NextResponse.json({ error: `Barcode “${dup}” is used twice on this product.` }, { status: 400 });
    }
    const keepIds = normalized.map((v) => v.id).filter(Boolean) as string[];
    const conflict = await findBarcodeConflict(barcodes, keepIds);
    if (conflict) {
      return NextResponse.json({ error: conflict }, { status: 409 });
    }
    parsed.data.variations = normalized;
  }

  try {
  await prisma.$transaction(async (tx) => {
    await tx.product.update({
      where: { id },
      data: {
        name: parsed.data.name ?? existing.name,
        description: parsed.data.description ?? existing.description,
        itemCode: parsed.data.itemCode === undefined ? existing.itemCode : parsed.data.itemCode,
        status: parsed.data.status ?? existing.status,
        featured: parsed.data.featured ?? existing.featured,
        categoryId: parsed.data.categoryId === undefined ? existing.categoryId : parsed.data.categoryId,
      },
    });

    if (parsed.data.variations) {
      const incomingIds = parsed.data.variations.map((v) => v.id).filter(Boolean) as string[];
      await tx.productVariation.deleteMany({
        where: { productId: id, id: { notIn: incomingIds.length ? incomingIds : ["__none__"] } },
      });
      for (const variation of parsed.data.variations) {
        if (variation.id) {
          await tx.productVariation.update({
            where: { id: variation.id },
            data: {
              size: variation.size,
              sku: variation.sku,
              barcode: variation.barcode,
              price: variation.price,
              salePrice: variation.salePrice ?? null,
            },
          });
          await setVariationStock(tx, variation.id, variation.stock, "MANUAL", "Admin product edit");
        } else {
          await tx.productVariation.create({
            data: {
              productId: id,
              size: variation.size,
              sku: variation.sku,
              barcode: variation.barcode,
              price: variation.price,
              salePrice: variation.salePrice ?? null,
              stock: variation.stock,
              reserved: 0,
              available: variation.stock,
            },
          });
        }
      }
    }
  });

  await audit({ adminId: admin.id, action: "update", entity: "Product", entityId: id });
  const product = await prisma.product.findUnique({
    where: { id },
    include: { images: true, variations: true },
  });
  return NextResponse.json(product);
  } catch (error) {
    console.error("Update product failed", error);
    return NextResponse.json({ error: formatProductSaveError(error) }, { status: 409 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const { admin, response } = await adminOr401();
  if (!admin) return response;
  const { id } = await context.params;
  const archive = new URL(request.url).searchParams.get("archive") === "1";
  const product = await prisma.product.findUnique({ where: { id }, include: { images: true } });
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (archive) {
    await prisma.product.update({ where: { id }, data: { status: "ARCHIVED" } });
    await audit({ adminId: admin.id, action: "archive", entity: "Product", entityId: id });
    return NextResponse.json({ ok: true, archived: true });
  }

  await prisma.product.delete({ where: { id } });
  await audit({ adminId: admin.id, action: "delete", entity: "Product", entityId: id });
  return NextResponse.json({ ok: true });
}
