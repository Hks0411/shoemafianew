import { NextResponse } from "next/server";
import { adminOr401 } from "@/lib/auth/guard";
import { prisma } from "@/lib/db";

export async function GET() {
  const { admin, response } = await adminOr401();
  if (!admin) return response;
  return NextResponse.json(await prisma.banner.findMany({ orderBy: { sortOrder: "asc" } }));
}

export async function POST(request: Request) {
  const { admin, response } = await adminOr401();
  if (!admin) return response;
  const body = await request.json();
  const banner = await prisma.banner.create({
    data: {
      title: String(body.title || "Banner"),
      subtitle: body.subtitle || null,
      imageUrl: String(body.imageUrl || ""),
      storedImageId: body.storedImageId || null,
      publicId: body.publicId || null,
      href: body.href || "/shop",
      active: body.active !== false,
      sortOrder: Number(body.sortOrder || 0),
    },
  });
  return NextResponse.json(banner);
}

export async function PUT(request: Request) {
  const { admin, response } = await adminOr401();
  if (!admin) return response;
  const body = await request.json();
  const banner = await prisma.banner.update({
    where: { id: body.id },
    data: {
      title: body.title,
      subtitle: body.subtitle,
      imageUrl: body.imageUrl,
      href: body.href,
      active: body.active,
      sortOrder: body.sortOrder,
    },
  });
  return NextResponse.json(banner);
}

export async function DELETE(request: Request) {
  const { admin, response } = await adminOr401();
  if (!admin) return response;
  const { id } = await request.json();
  await prisma.banner.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
