import { NextResponse } from "next/server";
import { adminOr401 } from "@/lib/auth/guard";
import { prisma } from "@/lib/db";

export async function GET() {
  const { admin, response } = await adminOr401();
  if (!admin) return response;
  return NextResponse.json(await prisma.testimonial.findMany({ orderBy: { sortOrder: "asc" } }));
}

export async function POST(request: Request) {
  const { admin, response } = await adminOr401();
  if (!admin) return response;
  const body = await request.json();
  const item = await prisma.testimonial.create({
    data: {
      authorName: String(body.authorName || "").trim(),
      rating: Math.min(5, Math.max(1, Number(body.rating || 5))),
      body: String(body.body || "").trim(),
      published: body.published !== false,
    },
  });
  return NextResponse.json(item);
}

export async function PUT(request: Request) {
  const { admin, response } = await adminOr401();
  if (!admin) return response;
  const body = await request.json();
  return NextResponse.json(
    await prisma.testimonial.update({
      where: { id: body.id },
      data: {
        authorName: body.authorName,
        rating: body.rating,
        body: body.body,
        published: body.published,
      },
    }),
  );
}

export async function DELETE(request: Request) {
  const { admin, response } = await adminOr401();
  if (!admin) return response;
  const { id } = await request.json();
  await prisma.testimonial.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
