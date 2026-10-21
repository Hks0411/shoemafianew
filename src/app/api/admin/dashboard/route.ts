import { NextResponse } from "next/server";
import { adminOr401 } from "@/lib/auth/guard";
import { prisma } from "@/lib/db";
import { getStoreSettings } from "@/lib/settings";

export async function GET() {
  const { admin, response } = await adminOr401();
  if (!admin) return response;
  const settings = await getStoreSettings();

  const [
    totalOrders,
    pendingOrders,
    paidPayments,
    productCount,
    variationCount,
    lowStock,
    recentOrders,
    importJobs,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { status: "PENDING_CONFIRMATION" } }),
    prisma.payment.aggregate({ where: { status: "PAID" }, _sum: { amount: true }, _count: true }),
    prisma.product.count({ where: { status: { not: "ARCHIVED" } } }),
    prisma.productVariation.count(),
    prisma.productVariation.findMany({
      where: { available: { lte: settings.lowStockThreshold } },
      include: { product: true },
      take: 12,
      orderBy: { available: "asc" },
    }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { payments: true },
    }),
    prisma.importJob.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
  ]);

  return NextResponse.json({
    totalOrders,
    pendingOrders,
    paidOrderCount: paidPayments._count,
    totalSales: Number(paidPayments._sum.amount ?? 0),
    productCount,
    variationCount,
    lowStock,
    recentOrders,
    importJobs,
  });
}
