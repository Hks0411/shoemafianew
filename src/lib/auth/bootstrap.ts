import { ensureStoreCategories } from "@/lib/categories";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { getStoreSettings, saveStoreSettings } from "@/lib/settings";
import { razorpayConfigured } from "@/lib/razorpay";

export function adminEnvCredentials() {
  const username = process.env.ADMIN_USERNAME?.trim() || "";
  const password = process.env.ADMIN_PASSWORD || "";
  const email = (process.env.ADMIN_EMAIL?.trim() || `${username.toLowerCase()}@shoemaafia.local`).toLowerCase();
  return { username, password, email };
}

export async function ensureBootstrapAdmin() {
  const { username, password, email } = adminEnvCredentials();
  if (!username || password.length < 8) return null;

  const existing = await prisma.adminUser.findUnique({ where: { username } });
  if (existing) return existing;

  const byEmail = await prisma.adminUser.findUnique({ where: { email } });
  if (byEmail) {
    return prisma.adminUser.update({
      where: { id: byEmail.id },
      data: { username, passwordHash: await hashPassword(password) },
    });
  }

  if ((await prisma.adminUser.count()) > 0) return null;

  return prisma.adminUser.create({
    data: {
      username,
      email,
      name: "Shoe Mafia Admin",
      passwordHash: await hashPassword(password),
    },
  });
}

export async function ensureStoreBootstrap() {
  await ensureStoreCategories(prisma);
  if (razorpayConfigured()) {
    const settings = await getStoreSettings();
    if (!settings.paymentsEnabled) {
      await saveStoreSettings({ ...settings, paymentsEnabled: true });
    }
  }
}
