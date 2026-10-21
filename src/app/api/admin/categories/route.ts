import { NextResponse } from "next/server";
import { adminOr401 } from "@/lib/auth/guard";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/slug";

export async function GET() {
  const { admin, response } = await adminOr401();
  if (!admin) return response;
  return NextResponse.json(await prisma.category.findMany({ orderBy: { name: "asc" } }));
}

export async function POST(request: Request) {
  const { admin, response } = await adminOr401();
  if (!admin) return response;
  const { name } = (await request.json()) as { name?: string };
  if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });
  const category = await prisma.category.create({
    data: { name: name.trim(), slug: slugify(name) },
  });
  return NextResponse.json(category);
}

export async function DELETE(request: Request) {
  const { admin, response } = await adminOr401();
  if (!admin) return response;
  const { id } = (await request.json()) as { id?: string };
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await prisma.category.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
