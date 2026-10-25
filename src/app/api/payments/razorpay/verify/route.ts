import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";

import { verifyRazorpaySignature } from "@/lib/razorpay";

import { getCustomerSession } from "@/lib/auth/customer-session";



export async function POST(request: Request) {

  const body = await request.json();

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = body as {

    razorpay_order_id?: string;

    razorpay_payment_id?: string;

    razorpay_signature?: string;

    orderId?: string;

  };

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderId) {

    return NextResponse.json({ error: "Missing payment verification fields" }, { status: 400 });

  }



  const session = await getCustomerSession();

  if (!session) {

    return NextResponse.json({ error: "Sign in to complete payment", code: "AUTH_REQUIRED" }, { status: 401 });

  }



  const owned = await prisma.order.findFirst({

    where: { id: orderId, customerId: session.customerId, customerPhone: session.phone },

    select: { id: true },

  });

  if (!owned) {

    return NextResponse.json({ error: "This order does not belong to your account" }, { status: 403 });

  }



  if (!verifyRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {

    await prisma.payment.updateMany({

      where: { orderId },

      data: { status: "FAILED" },

    });

    return NextResponse.json({ error: "Payment signature mismatch" }, { status: 400 });

  }



  await prisma.$transaction([

    prisma.payment.updateMany({

      where: { orderId, razorpayOrderId: razorpay_order_id },

      data: {

        status: "PAID",

        razorpayPaymentId: razorpay_payment_id,

        razorpaySignature: razorpay_signature,

      },

    }),

    prisma.order.update({

      where: { id: orderId },

      data: { status: "CONFIRMED" },

    }),

  ]);

  return NextResponse.json({ ok: true });

}

