import { NextResponse } from "next/server";
import { adminOr401 } from "@/lib/auth/guard";
import { prisma } from "@/lib/db";

export async function GET() {
  const { admin, response } = await adminOr401();
  if (!admin) return response;
  return NextResponse.json(
    await prisma.review.findMany({ orderBy: { createdAt: "desc" }, include: { product: true } }),
  );
}

export async function PUT(request: Request) {
  const { admin, response } = await adminOr401();
  if (!admin) return response;
  const { id, status } = await request.json();
  if (!["APPROVED", "REJECTED", "PENDING"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }
  return NextResponse.json(await prisma.review.update({ where: { id }, data: { status } }));
}

export async function DELETE(request: Request) {
  const { admin, response } = await adminOr401();
  if (!admin) return response;
  const { id } = await request.json();
  await prisma.review.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
