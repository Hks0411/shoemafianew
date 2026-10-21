import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { findCatalogProducts } from "@/lib/catalog";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  const category = url.searchParams.get("category");
  const size = url.searchParams.get("size");
  const sort = url.searchParams.get("sort") ?? "newest";
  const minPrice = url.searchParams.get("minPrice");
  const maxPrice = url.searchParams.get("maxPrice");
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
  const pageSize = Math.min(24, Math.max(8, Number(url.searchParams.get("pageSize") ?? 12)));

  const where: Prisma.ProductWhereInput = { status: "ACTIVE" };
  if (category) where.category = { slug: category };
  if (q) {
    where.OR = [
      { name: { contains: q } },
      { itemCode: { contains: q } },
      { variations: { some: { OR: [{ barcode: q }, { sku: { contains: q } }] } } },
    ];
  }
  const variationSome: Prisma.ProductVariationWhereInput = {};
  if (size) {
    variationSome.size = size;
    variationSome.available = { gt: 0 };
  }
  const priceFilter: Prisma.DecimalFilter = {};
  if (minPrice) priceFilter.gte = Number(minPrice);
  if (maxPrice) priceFilter.lte = Number(maxPrice);
  if (Object.keys(priceFilter).length) variationSome.price = priceFilter;
  if (Object.keys(variationSome).length) where.variations = { some: variationSome };

  const [total, items] = await Promise.all([
    prisma.product.count({ where }),
    findCatalogProducts({
      where,
      sort,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        images: { orderBy: { sortOrder: "asc" as const }, take: 2 },
        variations: true,
        category: true,
      },
    }),
  ]);

  return NextResponse.json({ total, page, pageSize, items });
}
