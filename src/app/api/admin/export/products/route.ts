import { NextResponse } from "next/server";
import { adminOr401 } from "@/lib/auth/guard";
import { prisma } from "@/lib/db";

export async function GET() {
  const { admin, response } = await adminOr401();
  if (!admin) return response;
  const rows = await prisma.productVariation.findMany({
    include: { product: true },
    orderBy: { createdAt: "desc" },
    take: 50000,
  });
  const header = "productId,productName,itemCode,size,sku,barcode,price,salePrice,stock,available,status\n";
  const csv = rows
    .map((row) =>
      [
        row.productId,
        csvEscape(row.product.name),
        csvEscape(row.product.itemCode || ""),
        csvEscape(row.size),
        csvEscape(row.sku || ""),
        csvEscape(row.barcode || ""),
        row.price,
        row.salePrice ?? "",
        row.stock,
        row.available,
        row.product.status,
      ].join(","),
    )
    .join("\n");
  return new NextResponse(header + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=shoe-mafia-products.csv",
    },
  });
}

function csvEscape(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}
