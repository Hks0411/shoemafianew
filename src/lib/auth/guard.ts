import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export async function requireAdmin() {
  const session = await getAdminSession();
  if (!session) return null;
  const admin = await prisma.adminUser.findUnique({ where: { id: session.adminId } });
  return admin;
}

export async function adminOr401() {
  const admin = await requireAdmin();
  if (!admin) {
    return { admin: null, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { admin, response: null };
}
