import { NextResponse } from "next/server";
import { adminOr401 } from "@/lib/auth/guard";
import { prisma } from "@/lib/db";

export async function GET() {
  const { admin, response } = await adminOr401();
  if (!admin) return response;
  const orders = await prisma.order.findMany({
    include: { items: true, payments: true },
    orderBy: { createdAt: "desc" },
    take: 20000,
  });
  const header = "orderNumber,date,customer,phone,city,status,paymentStatus,total,items\n";
  const csv = orders
    .map((order) => {
      const payment = order.payments[0];
      return [
        order.orderNumber,
        order.createdAt.toISOString(),
        `"${order.customerName.replace(/"/g, '""')}"`,
        order.customerPhone,
        `"${order.city}"`,
        order.status,
        payment?.status ?? "UNPAID",
        order.total,
        `"${order.items.map((item) => `${item.productName} ${item.size} x${item.quantity}`).join("; ").replace(/"/g, '""')}"`,
      ].join(",");
    })
    .join("\n");
  return new NextResponse(header + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=shoe-mafia-orders.csv",
    },
  });
}
