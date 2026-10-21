import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRazorpay, razorpayConfigured } from "@/lib/razorpay";
import { toPaise } from "@/lib/money";
import { getStoreSettings } from "@/lib/settings";
import { getCustomerSession } from "@/lib/auth/customer-session";
import { getCustomerSession } from "@/lib/auth/customer-session";

export async function POST(request: Request) {
  if (!razorpayConfigured()) {
    return NextResponse.json(
      { error: "Razorpay is not activated yet. Add keys in the environment file." },
      { status: 503 },
    );
  }
  const settings = await getStoreSettings();
  if (!settings.paymentsEnabled) {
    return NextResponse.json({ error: "Online payments are not enabled in store settings." }, { status: 503 });
  }
  const session = await getCustomerSession();
  if (!session) {
    return NextResponse.json({ error: "Sign in to pay for an order", code: "AUTH_REQUIRED" }, { status: 401 });
  }

  const session = await getCustomerSession();
  if (!session) {
    return NextResponse.json({ error: "Sign in to pay for an order", code: "AUTH_REQUIRED" }, { status: 401 });
  }

  const { orderId } = (await request.json()) as { orderId?: string };
  if (!orderId) return NextResponse.json({ error: "orderId required" }, { status: 400 });
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { payments: true } });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (order.customerId !== session.customerId || order.customerPhone !== session.phone) {
    return NextResponse.json({ error: "This order does not belong to your account" }, { status: 403 });
  }
  if (order.customerId !== session.customerId || order.customerPhone !== session.phone) {
    return NextResponse.json({ error: "This order does not belong to your account" }, { status: 403 });
  }

  const razorpay = await getRazorpay();
  const rzpOrder = await razorpay.orders.create({
    amount: toPaise(Number(order.total)),
    currency: "INR",
    receipt: order.orderNumber,
  });
  await prisma.payment.updateMany({
    where: { orderId: order.id },
    data: { razorpayOrderId: rzpOrder.id, method: "RAZORPAY", status: "PENDING" },
  });
  return NextResponse.json({
    keyId: process.env.RAZORPAY_KEY_ID,
    razorpayOrderId: rzpOrder.id,
    amount: rzpOrder.amount,
    currency: rzpOrder.currency,
    orderNumber: order.orderNumber,
  });
}
