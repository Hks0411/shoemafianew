import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { verifyWebhookSignature } from "@/lib/razorpay";

export async function POST(request: Request) {
  const raw = await request.text();
  const signature = request.headers.get("x-razorpay-signature") || "";
  if (!verifyWebhookSignature(raw, signature)) {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  const payload = JSON.parse(raw) as {
    event?: string;
    payload?: { payment?: { entity?: { id?: string; order_id?: string; status?: string } } };
  };
  const eventId =
    request.headers.get("x-razorpay-event-id") ||
    `${payload.event || "event"}:${payload.payload?.payment?.entity?.id || "unknown"}:${payload.payload?.payment?.entity?.order_id || "none"}`;

  try {
    await prisma.webhookEvent.create({
      data: {
        provider: "razorpay",
        eventId,
        eventType: payload.event || "unknown",
        payload: raw,
        processed: false,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ ok: true, duplicate: true });
    }
    throw error;
  }

  const payment = payload.payload?.payment?.entity;
  if (payment?.order_id) {
    const status = payment.status === "captured" ? "PAID" : payment.status === "failed" ? "FAILED" : "PENDING";
    const record = await prisma.payment.findFirst({ where: { razorpayOrderId: payment.order_id } });
    if (record) {
      await prisma.payment.update({
        where: { id: record.id },
        data: {
          status,
          razorpayPaymentId: payment.id,
        },
      });
      if (status === "PAID") {
        await prisma.order.update({
          where: { id: record.orderId },
          data: { status: "CONFIRMED" },
        });
      }
    }
  }

  await prisma.webhookEvent.update({ where: { eventId }, data: { processed: true } });
  return NextResponse.json({ ok: true });
}
