import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { setAdminSession } from "@/lib/auth/session";
import { rateLimit, clientKey } from "@/lib/security/rate-limit";
import { ensureBootstrapAdmin } from "@/lib/auth/bootstrap";

const schema = z.object({
  username: z.string().min(1).max(80),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  const limited = rateLimit(clientKey(request, "login"), 8, 60_000);
  if (!limited.ok) return NextResponse.json({ error: "Too many login attempts. Try again shortly." }, { status: 429 });

  try {
    await ensureBootstrapAdmin();
  } catch {
    return NextResponse.json({ error: "Database is not ready yet." }, { status: 503 });
  }

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid credentials" }, { status: 400 });

  const username = parsed.data.username.trim();
  const admin =
    (await prisma.adminUser.findUnique({ where: { username } })) ||
    (await prisma.adminUser.findUnique({ where: { email: username.toLowerCase() } }));

  if (!admin || !(await verifyPassword(parsed.data.password, admin.passwordHash))) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }
  await setAdminSession(admin.id, admin.email);
  return NextResponse.json({ ok: true, name: admin.name, username: admin.username });
}
