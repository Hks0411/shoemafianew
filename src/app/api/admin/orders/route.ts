import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { adminOr401 } from "@/lib/auth/guard";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const { admin, response } = await adminOr401();
  if (!admin) return response;
  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  const status = url.searchParams.get("status");
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
  const pageSize = 20;

  const where: Prisma.OrderWhereInput = {};
  if (status) where.status = status as Prisma.OrderWhereInput["status"];
  if (q) {
    where.OR = [
      { orderNumber: { contains: q } },
      { customerName: { contains: q } },
      { customerPhone: { contains: q } },
    ];
  }

  const [total, items] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      include: { payments: true, items: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);
  return NextResponse.json({ total, page, pageSize, items });
}
