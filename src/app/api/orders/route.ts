import { NextResponse } from "next/server";
import { z } from "zod";
import { createOrderFromItems } from "@/lib/orders";
import { getCustomerSession } from "@/lib/auth/customer-session";
import { prisma } from "@/lib/db";
import { rateLimit, clientKey } from "@/lib/security/rate-limit";

const schema = z.object({
  items: z.array(z.object({ variationId: z.string(), quantity: z.number().int().positive() })).min(1),
  customerName: z.string().min(2).max(80),
  customerEmail: z.string().email().optional().or(z.literal("")),
  addressLine: z.string().min(8).max(300).optional(),
  city: z.string().min(2).max(80).optional(),
  state: z.string().min(2).max(80).optional(),
  pincode: z.string().regex(/^\d{6}$/).optional(),
  notes: z.string().max(400).optional(),
  method: z.enum(["COD", "RAZORPAY"]).default("COD"),
});

export async function POST(request: Request) {
  const limited = rateLimit(clientKey(request, "checkout"), 10, 60_000);
  if (!limited.ok) return NextResponse.json({ error: "Too many checkout attempts" }, { status: 429 });

  const session = await getCustomerSession();
  if (!session) {
    return NextResponse.json({ error: "Sign in with OTP before checkout", code: "AUTH_REQUIRED" }, { status: 401 });
  }

  const customer = await prisma.customer.findUnique({ where: { id: session.customerId } });
  if (!customer || customer.phone !== session.phone) {
    return NextResponse.json({ error: "Sign in again to continue", code: "AUTH_REQUIRED" }, { status: 401 });
  }

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid checkout details" }, { status: 400 });
  }

  try {
    const order = await createOrderFromItems({
      ...parsed.data,
      customerId: customer.id,
      customerPhone: customer.phone,
      customerEmail: parsed.data.customerEmail || undefined,
    });
    return NextResponse.json({
      orderId: order.id,
      orderNumber: order.orderNumber,
      total: Number(order.total),
      method: parsed.data.method,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not place order" },
      { status: 409 },
    );
  }
}
