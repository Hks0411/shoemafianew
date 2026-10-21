import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const product = await prisma.product.findFirst({
    where: { OR: [{ id }, { slug: id }], status: "ACTIVE" },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      variations: true,
      category: true,
      reviews: { where: { status: "APPROVED" }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const related = product.categoryId
    ? await prisma.product.findMany({
        where: { categoryId: product.categoryId, status: "ACTIVE", id: { not: product.id } },
        include: { images: { take: 1 }, variations: true },
        take: 4,
      })
    : [];

  return NextResponse.json({ product, related });
}
