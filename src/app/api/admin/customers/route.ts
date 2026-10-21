import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { adminOr401 } from "@/lib/auth/guard";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const { admin, response } = await adminOr401();
  if (!admin) return response;
  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
  const pageSize = 20;
  const where: Prisma.CustomerWhereInput = q
    ? { OR: [{ name: { contains: q } }, { phone: { contains: q } }, { email: { contains: q } }] }
    : {};
  const [total, items] = await Promise.all([
    prisma.customer.count({ where }),
    prisma.customer.findMany({
      where,
      include: { _count: { select: { orders: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);
  return NextResponse.json({ total, page, pageSize, items });
}
