import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireCustomer } from "@/lib/auth/customer-guard";
import { fromDecimal } from "@/lib/money";

export async function GET() {
  const { customer, response } = await requireCustomer();
  if (!customer) return response!;

  const orders = await prisma.order.findMany({
    where: { customerId: customer.id },
    orderBy: { createdAt: "desc" },
    include: {
      items: true,
      payments: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  return NextResponse.json({
    orders: orders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      total: fromDecimal(order.total),
      createdAt: order.createdAt.toISOString(),
      paymentStatus: order.payments[0]?.status ?? "UNPAID",
      items: order.items.map((item) => ({
        productName: item.productName,
        size: item.size,
        quantity: item.quantity,
        lineTotal: fromDecimal(item.lineTotal),
      })),
    })),
  });
}
