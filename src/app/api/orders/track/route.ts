import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const orderNumber = url.searchParams.get("orderNumber")?.trim();
  const phone = url.searchParams.get("phone")?.trim();
  if (!orderNumber || !phone) {
    return NextResponse.json({ error: "Order number and phone are required" }, { status: 400 });
  }
  const order = await prisma.order.findFirst({
    where: { orderNumber, customerPhone: phone },
    include: { items: true, payments: true },
  });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  return NextResponse.json(order);
}
