import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { setAdminSession } from "@/lib/auth/session";
import { rateLimit, clientKey } from "@/lib/security/rate-limit";
import { audit } from "@/lib/audit";

const schema = z.object({
  name: z.string().min(2).max(80),
  username: z.string().min(3).max(80).optional(),
  email: z.string().email(),
  password: z.string().min(10).max(100),
});

export async function POST(request: Request) {
  const limited = rateLimit(clientKey(request, "setup"), 5, 60_000);
  if (!limited.ok) return NextResponse.json({ error: "Too many attempts" }, { status: 429 });

  const existing = await prisma.adminUser.count();
  if (existing > 0) {
    return NextResponse.json({ error: "Admin already exists. Use the login page." }, { status: 409 });
  }

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Provide a name, valid email, and a password of at least 10 characters." }, { status: 400 });
  }

  const admin = await prisma.adminUser.create({
    data: {
      name: parsed.data.name,
      username: parsed.data.username?.trim() || parsed.data.email.split("@")[0],
      email: parsed.data.email.toLowerCase(),
      passwordHash: await hashPassword(parsed.data.password),
    },
  });
  await setAdminSession(admin.id, admin.email);
  await audit({ adminId: admin.id, action: "setup", entity: "AdminUser", entityId: admin.id });
  return NextResponse.json({ ok: true });
}
