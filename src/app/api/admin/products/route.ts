import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { adminOr401 } from "@/lib/auth/guard";
import { prisma } from "@/lib/db";
import { uniqueSlug } from "@/lib/slug";
import { audit } from "@/lib/audit";

const variationSchema = z.object({
  size: z.string().min(1).max(20),
  sku: z.string().max(80).optional().nullable(),
  barcode: z.string().max(80).optional().nullable(),
  price: z.number().nonnegative(),
  salePrice: z.number().nonnegative().optional().nullable(),
  stock: z.number().int().nonnegative(),
});

const createSchema = z.object({
  name: z.string().min(1).max(180),
  description: z.string().max(8000).optional().default(""),
  itemCode: z.string().max(80).optional().nullable(),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).optional(),
  featured: z.boolean().optional(),
  categoryId: z.string().optional().nullable(),
  variations: z.array(variationSchema).min(1),
});

export async function GET(request: Request) {
  const { admin, response } = await adminOr401();
  if (!admin) return response;

  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
  const pageSize = Math.min(50, Math.max(10, Number(url.searchParams.get("pageSize") ?? 20)));
  const status = url.searchParams.get("status");
  const lowStock = url.searchParams.get("lowStock") === "1";

  const where: Prisma.ProductWhereInput = {};
  if (status && ["DRAFT", "ACTIVE", "ARCHIVED"].includes(status)) {
    where.status = status as "DRAFT" | "ACTIVE" | "ARCHIVED";
  }
  if (q) {
    where.OR = [
      { name: { contains: q } },
      { itemCode: { contains: q } },
      { variations: { some: { OR: [{ barcode: q }, { sku: { contains: q } }, { size: q }] } } },
    ];
  }
  if (lowStock) {
    where.variations = { some: { available: { lte: 3 } } };
  }

  const [total, items] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      include: {
        images: { orderBy: { sortOrder: "asc" }, take: 1 },
        variations: true,
        category: true,
      },
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return NextResponse.json({ total, page, pageSize, items });
}

export async function POST(request: Request) {
  const { admin, response } = await adminOr401();
  if (!admin) return response;
  const parsed = createSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Check the product details and add at least one size." }, { status: 400 });
  }

  const product = await prisma.product.create({
    data: {
      name: parsed.data.name,
      slug: uniqueSlug(parsed.data.name, Date.now().toString()),
      description: parsed.data.description ?? "",
      itemCode: parsed.data.itemCode || null,
      status: parsed.data.status ?? "ACTIVE",
      featured: parsed.data.featured ?? false,
      categoryId: parsed.data.categoryId || null,
      variations: {
        create: parsed.data.variations.map((v) => ({
          size: v.size,
          sku: v.sku || null,
          barcode: v.barcode || null,
          price: v.price,
          salePrice: v.salePrice ?? null,
          stock: v.stock,
          reserved: 0,
          available: v.stock,
        })),
      },
    },
    include: { variations: true },
  });
  await audit({ adminId: admin.id, action: "create", entity: "Product", entityId: product.id, detail: { name: product.name } });
  return NextResponse.json(product);
}
