import { createHash, randomInt } from "crypto";
import { prisma } from "@/lib/db";

const OTP_TTL_MS = 10 * 60 * 1000;

export function normalizePhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10 && /^[6-9]/.test(digits)) return digits;
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  return null;
}

function hashOtp(phone: string, code: string) {
  return createHash("sha256").update(`${phone}:${code}:${process.env.ADMIN_SESSION_SECRET || "dev"}`).digest("hex");
}

export function generateOtpCode() {
  return String(randomInt(100000, 999999));
}

export async function createCustomerOtp(phone: string) {
  const code = generateOtpCode();
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);
  await prisma.customerOtp.deleteMany({ where: { phone } });
  await prisma.customerOtp.create({
    data: {
      phone,
      codeHash: hashOtp(phone, code),
      expiresAt,
    },
  });
  return { code, expiresAt };
}

export async function verifyCustomerOtp(phone: string, code: string) {
  const row = await prisma.customerOtp.findFirst({
    where: { phone, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  if (!row) return false;
  const ok = row.codeHash === hashOtp(phone, code.trim());
  if (ok) await prisma.customerOtp.deleteMany({ where: { phone } });
  return ok;
}
