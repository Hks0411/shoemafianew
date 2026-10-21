import { NextResponse } from "next/server";
import { adminOr401 } from "@/lib/auth/guard";
import { prisma } from "@/lib/db";
import { attachProductImage, createStoredImage, databaseSetupHint, mediaUrl, validateImage } from "@/lib/media";

export async function POST(request: Request) {
  const { admin, response } = await adminOr401();
  if (!admin) return response;

  const form = await request.formData();
  const file = form.get("file");
  const productId = String(form.get("productId") || "").trim();
  if (!(file instanceof File)) return NextResponse.json({ error: "Choose an image file" }, { status: 400 });
  const buffer = Buffer.from(await file.arrayBuffer());
  let mimeType: string;
  try {
    mimeType = validateImage(buffer, file.type);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid image" }, { status: 400 });
  }

  try {
    if (productId) {
      const { image, stored } = await attachProductImage(prisma, productId, buffer, mimeType);
      return NextResponse.json({ ...image, storedImageId: stored.id });
    }

    const stored = await createStoredImage(prisma, buffer, mimeType);
    const url = mediaUrl(stored.id);
    return NextResponse.json({
      storedImageId: stored.id,
      publicId: stored.id,
      url,
      width: null,
      height: null,
    });
  } catch (error) {
    const hint = databaseSetupHint(error);
    return NextResponse.json(
      {
        error: hint || (error instanceof Error ? error.message : "Upload failed"),
      },
      { status: hint ? 503 : 500 },
    );
  }
}

export async function DELETE(request: Request) {
  const { admin, response } = await adminOr401();
  if (!admin) return response;
  const { imageId } = (await request.json()) as { imageId?: string };
  if (!imageId) return NextResponse.json({ error: "imageId required" }, { status: 400 });
  const image = await prisma.productImage.findUnique({ where: { id: imageId } });
  if (!image) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.productImage.delete({ where: { id: imageId } });
  return NextResponse.json({ ok: true });
}
