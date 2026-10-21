import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const productInclude = {
  images: { orderBy: { sortOrder: "asc" as const }, take: 1 },
  variations: true,
};

export async function GET() {
  const [banners, featured, newest, testimonials, categories] = await Promise.all([
    prisma.banner.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    prisma.product.findMany({
      where: { featured: true, status: "ACTIVE" },
      include: productInclude,
      take: 8,
      orderBy: { updatedAt: "desc" },
    }),
    prisma.product.findMany({
      where: { status: "ACTIVE" },
      include: productInclude,
      take: 8,
      orderBy: { createdAt: "desc" },
    }),
    prisma.testimonial.findMany({ where: { published: true }, orderBy: { sortOrder: "asc" }, take: 8 }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);
  return NextResponse.json({ banners, featured, newest, testimonials, categories });
}
