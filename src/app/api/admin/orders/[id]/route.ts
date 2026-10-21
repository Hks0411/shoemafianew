import { NextResponse } from "next/server";
import { adminOr401 } from "@/lib/auth/guard";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { fulfillStock, releaseStock, returnStock } from "@/lib/inventory";

const STATUSES = [
  "PENDING_CONFIRMATION",
  "CONFIRMED",
  "PROCESSING",
  "PACKED",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
  "RETURNED",
] as const;

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { admin, response } = await adminOr401();
  if (!admin) return response;
  const { id } = await context.params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true, payments: true, customer: true },
  });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(order);
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const { admin, response } = await adminOr401();
  if (!admin) return response;
  const { id } = await context.params;
  const body = (await request.json()) as { status?: (typeof STATUSES)[number] };
  if (!body.status || !STATUSES.includes(body.status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }
  const order = await prisma.order.findUnique({ where: { id }, include: { items: true } });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const lines = order.items
    .filter((item) => item.variationId)
    .map((item) => ({ variationId: item.variationId as string, quantity: item.quantity }));

  if (body.status === "CANCELLED" && order.status !== "CANCELLED" && order.status !== "DELIVERED" && order.status !== "RETURNED") {
    if (lines.length) await releaseStock(order.id, lines);
  }
  if (body.status === "DELIVERED" && order.status !== "DELIVERED" && order.status !== "CANCELLED" && order.status !== "RETURNED") {
    if (lines.length) await fulfillStock(order.id, lines);
  }
  if (body.status === "RETURNED" && order.status === "DELIVERED") {
    if (lines.length) await returnStock(order.id, lines);
  }

  const updated = await prisma.order.update({ where: { id }, data: { status: body.status }, include: { items: true, payments: true } });
  await audit({ adminId: admin.id, action: "status", entity: "Order", entityId: id, detail: { status: body.status } });
  return NextResponse.json(updated);
}
