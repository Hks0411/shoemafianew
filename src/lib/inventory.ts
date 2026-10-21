import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function setVariationStock(
  tx: Prisma.TransactionClient,
  variationId: string,
  stock: number,
  reason: "IMPORT" | "MANUAL" | "ADJUSTMENT",
  note?: string,
) {
  const current = await tx.productVariation.findUnique({ where: { id: variationId } });
  if (!current) throw new Error("Variation not found");
  const available = Math.max(0, stock - current.reserved);
  await tx.productVariation.update({
    where: { id: variationId },
    data: { stock, available },
  });
  await tx.inventoryMovement.create({
    data: {
      variationId,
      delta: stock - current.stock,
      reason,
      note,
    },
  });
}

export async function reserveStock(orderId: string, lines: Array<{ variationId: string; quantity: number }>) {
  await prisma.$transaction(async (tx) => {
    for (const line of lines) {
      const updated = await tx.productVariation.updateMany({
        where: { id: line.variationId, available: { gte: line.quantity } },
        data: {
          reserved: { increment: line.quantity },
          available: { decrement: line.quantity },
        },
      });
      if (updated.count !== 1) {
        throw new Error("One or more sizes are no longer available in the requested quantity");
      }
      await tx.inventoryMovement.create({
        data: {
          variationId: line.variationId,
          delta: -line.quantity,
          reason: "ORDER_RESERVE",
          orderId,
        },
      });
    }
  });
}

export async function releaseStock(orderId: string, lines: Array<{ variationId: string; quantity: number }>) {
  await prisma.$transaction(async (tx) => {
    for (const line of lines) {
      await tx.productVariation.update({
        where: { id: line.variationId },
        data: {
          reserved: { decrement: line.quantity },
          available: { increment: line.quantity },
        },
      });
      await tx.inventoryMovement.create({
        data: {
          variationId: line.variationId,
          delta: line.quantity,
          reason: "ORDER_RELEASE",
          orderId,
        },
      });
    }
  });
}

export async function fulfillStock(orderId: string, lines: Array<{ variationId: string; quantity: number }>) {
  await prisma.$transaction(async (tx) => {
    for (const line of lines) {
      await tx.productVariation.update({
        where: { id: line.variationId },
        data: {
          reserved: { decrement: line.quantity },
          stock: { decrement: line.quantity },
        },
      });
      await tx.inventoryMovement.create({
        data: {
          variationId: line.variationId,
          delta: -line.quantity,
          reason: "ORDER_FULFILL",
          orderId,
        },
      });
    }
  });
}

export async function returnStock(orderId: string, lines: Array<{ variationId: string; quantity: number }>) {
  await prisma.$transaction(async (tx) => {
    for (const line of lines) {
      await tx.productVariation.update({
        where: { id: line.variationId },
        data: {
          stock: { increment: line.quantity },
          available: { increment: line.quantity },
        },
      });
      await tx.inventoryMovement.create({
        data: {
          variationId: line.variationId,
          delta: line.quantity,
          reason: "RETURN",
          orderId,
        },
      });
    }
  });
}
