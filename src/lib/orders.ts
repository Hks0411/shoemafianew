import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";
import { effectivePrice, fromDecimal } from "@/lib/money";
import { getStoreSettings } from "@/lib/settings";
import { courierChargeForMethod } from "@/lib/shipping";
export type CheckoutItem = { variationId: string; quantity: number };

export function nextOrderNumber() {
  const now = new Date();
  const y = now.getFullYear().toString().slice(-2);
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const rand = randomBytes(3).toString("hex").toUpperCase();
  return `SM${y}${m}${d}${rand}`;
}

export async function createOrderFromItems(input: {
  items: CheckoutItem[];
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  addressLine?: string;
  city?: string;
  state?: string;
  pincode?: string;
  notes?: string;
  method?: "COD" | "RAZORPAY";
}) {
  if (!input.items.length) throw new Error("Cart is empty");

  const settings = await getStoreSettings();
  const method = input.method ?? "COD";

  return prisma.$transaction(async (tx) => {
    const variations = await tx.productVariation.findMany({
      where: { id: { in: input.items.map((i) => i.variationId) } },
      include: { product: { include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } } } },
    });
    const byId = new Map(variations.map((v) => [v.id, v]));

    let subtotal = 0;
    const lines = input.items.map((item) => {
      const variation = byId.get(item.variationId);
      if (!variation || variation.product.status !== "ACTIVE") {
        throw new Error("A selected product is no longer available");
      }
      if (item.quantity < 1) throw new Error("Invalid quantity");
      const unit = effectivePrice(fromDecimal(variation.price), fromDecimal(variation.salePrice));
      const lineTotal = unit * item.quantity;
      subtotal += lineTotal;
      return {
        variation,
        quantity: item.quantity,
        unitPrice: unit,
        lineTotal,
      };
    });

    for (const line of lines) {
      const updated = await tx.productVariation.updateMany({
        where: { id: line.variation.id, available: { gte: line.quantity } },
        data: {
          reserved: { increment: line.quantity },
          available: { decrement: line.quantity },
        },
      });
      if (updated.count !== 1) {
        throw new Error(`${line.variation.product.name} size ${line.variation.size} does not have enough stock`);
      }
    }

    const shipping = courierChargeForMethod(method, settings);
    const total = subtotal + shipping;
    const orderNumber = nextOrderNumber();

    const customer = await tx.customer.findUnique({ where: { id: input.customerId } });
    if (!customer || customer.phone !== input.customerPhone) {
      throw new Error("Sign in with your mobile number to place an order");
    }

    let addressLine: string;
    let city: string;
    let state: string;
    let pincode: string;

    if (customer.addressLocked) {
      if (!customer.addressLine || !customer.city || !customer.state || !customer.pincode) {
        throw new Error("Add your delivery address in My account before checkout");
      }
      addressLine = customer.addressLine;
      city = customer.city;
      state = customer.state;
      pincode = customer.pincode;
    } else {
      if (!input.addressLine || !input.city || !input.state || !input.pincode) {
        throw new Error("Enter your complete delivery address");
      }
      addressLine = input.addressLine;
      city = input.city;
      state = input.state;
      pincode = input.pincode;
    }

    await tx.customer.update({
      where: { id: customer.id },
      data: {
        name: input.customerName,
        email: input.customerEmail ?? undefined,
        ...(customer.addressLocked
          ? {}
          : {
              addressLine,
              city,
              state,
              pincode,
              addressLocked: true,
            }),
      },
    });

    const order = await tx.order.create({
      data: {
        orderNumber,
        customerId: customer.id,
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        customerEmail: input.customerEmail,
        addressLine,
        city,
        state,
        pincode,
        notes: input.notes,
        subtotal,
        shippingCharge: shipping,
        discount: 0,
        total,
        reviewToken: randomBytes(16).toString("hex"),
        items: {
          create: lines.map((line) => ({
            variationId: line.variation.id,
            productName: line.variation.product.name,
            size: line.variation.size,
            sku: line.variation.sku,
            barcode: line.variation.barcode,
            imageUrl: line.variation.product.images[0]?.url,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            lineTotal: line.lineTotal,
          })),
        },
        payments: {
          create: {
            method,
            status: method === "COD" ? "UNPAID" : "PENDING",
            amount: total,
          },
        },
      },
      include: { items: true, payments: true },
    });

    for (const line of lines) {
      await tx.inventoryMovement.create({
        data: {
          variationId: line.variation.id,
          delta: -line.quantity,
          reason: "ORDER_RESERVE",
          orderId: order.id,
        },
      });
    }

    return order;
  });
}
