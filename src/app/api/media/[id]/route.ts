import { prisma } from "@/lib/db";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const image = await prisma.storedImage.findUnique({
    where: { id },
    select: { mimeType: true, data: true, createdAt: true },
  });
  if (!image) {
    return new Response("Not found", { status: 404 });
  }

  const body = Buffer.from(image.data);
  return new Response(body, {
    headers: {
      "Content-Type": image.mimeType,
      "Content-Length": String(body.length),
      "Cache-Control": "public, max-age=31536000, immutable",
      "Last-Modified": image.createdAt.toUTCString(),
    },
  });
}
