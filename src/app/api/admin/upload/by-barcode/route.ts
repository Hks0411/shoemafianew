import { NextResponse } from "next/server";
import { adminOr401 } from "@/lib/auth/guard";
import { prisma } from "@/lib/db";
import { asBarcode } from "@/lib/import/mapping";
import { attachProductImage, databaseSetupHint, validateImage } from "@/lib/media";
import { audit } from "@/lib/audit";

export async function POST(request: Request) {
  const { admin, response } = await adminOr401();
  if (!admin) return response;

  const form = await request.formData();
  const file = form.get("file");
  const rawBarcode = form.get("barcode");
  const barcode = asBarcode(rawBarcode);
  if (!barcode) {
    return NextResponse.json({ error: "Enter a valid barcode (BCN)" }, { status: 400 });
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Choose an image file" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  let mimeType: string;
  try {
    mimeType = validateImage(buffer, file.type);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid image" }, { status: 400 });
  }

  const variation = await prisma.productVariation.findFirst({
    where: { barcode },
    include: { product: { select: { id: true, name: true } } },
  });
  if (!variation) {
    return NextResponse.json(
      { error: `No product variation found with barcode ${barcode}. Import or add the SKU first.` },
      { status: 404 },
    );
  }

  try {
    const { image } = await attachProductImage(prisma, variation.productId, buffer, mimeType);
    await audit({
      adminId: admin.id,
      action: "upload",
      entity: "ProductImage",
      entityId: image.id,
      detail: { barcode, productId: variation.productId, productName: variation.product.name },
    });
    return NextResponse.json({
      ok: true,
      image,
      product: variation.product,
      size: variation.size,
      barcode,
    });
  } catch (error) {
    const hint = databaseSetupHint(error);
    return NextResponse.json(
      { error: hint || (error instanceof Error ? error.message : "Upload failed") },
      { status: hint ? 503 : 500 },
    );
  }
}
