import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guard";
import { prisma } from "@/lib/db";
import { razorpayConfigured } from "@/lib/razorpay";
import { ensureBootstrapAdmin } from "@/lib/auth/bootstrap";

export async function GET() {
  try {
    await ensureBootstrapAdmin();
  } catch {
    // Database may still be starting.
  }
  const admin = await requireAdmin();
  const adminCount = await prisma.adminUser.count().catch(() => 0);
  return NextResponse.json({
    authenticated: Boolean(admin),
    needsSetup: adminCount === 0,
    admin: admin ? { id: admin.id, name: admin.name, email: admin.email, username: admin.username } : null,
    integrations: {
      imageStorage: "mysql",
      razorpay: razorpayConfigured(),
    },
  });
}
