import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { rateLimit, clientKey } from "@/lib/security/rate-limit";

const schema = z.object({
  token: z.string().min(10),
  authorName: z.string().min(2).max(80),
  rating: z.number().int().min(1).max(5),
  body: z.string().min(8).max(1000),
  productId: z.string().optional(),
});

export async function POST(request: Request) {
  const limited = rateLimit(clientKey(request, "review"), 8, 60_000);
  if (!limited.ok) return NextResponse.json({ error: "Too many submissions" }, { status: 429 });
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Please complete the review form." }, { status: 400 });

  const order = await prisma.order.findUnique({
    where: { reviewToken: parsed.data.token },
    include: { items: true, customer: true },
  });
  if (!order || order.status !== "DELIVERED") {
    return NextResponse.json({ error: "Reviews can be submitted after delivery using a valid order link." }, { status: 400 });
  }

  let productId = parsed.data.productId || null;
  if (!productId && order.items[0]?.variationId) {
    const variation = await prisma.productVariation.findUnique({
      where: { id: order.items[0].variationId },
      select: { productId: true },
    });
    productId = variation?.productId ?? null;
  }

  const review = await prisma.review.create({
    data: {
      orderId: order.id,
      customerId: order.customerId,
      productId,
      authorName: parsed.data.authorName,
      rating: parsed.data.rating,
      body: parsed.data.body,
      verified: true,
      status: "PENDING",
    },
  });
  return NextResponse.json({ ok: true, id: review.id });
}
