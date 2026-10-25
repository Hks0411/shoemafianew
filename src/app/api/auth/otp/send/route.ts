import { NextResponse } from "next/server";
import { z } from "zod";
import { createCustomerOtp, normalizePhone } from "@/lib/auth/customer-otp";
import { rateLimit, clientKey } from "@/lib/security/rate-limit";
import { describeDatabaseError } from "@/lib/database-issue";

export const maxDuration = 30;

const schema = z.object({
  phone: z.string().min(10).max(15),
});

export async function POST(request: Request) {
  const limited = rateLimit(clientKey(request, "otp-send"), 5, 60_000);
  if (!limited.ok) {
    return NextResponse.json({ error: "Too many OTP requests. Wait a minute." }, { status: 429 });
  }

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid mobile number" }, { status: 400 });

  const phone = normalizePhone(parsed.data.phone);
  if (!phone) return NextResponse.json({ error: "Enter a valid 10-digit Indian mobile number" }, { status: 400 });

  try {
    const { code, expiresAt } = await createCustomerOtp(phone);
    return NextResponse.json({
      ok: true,
      phone,
      /** Shown on screen for demo / in-store verification (no SMS gateway yet). */
      displayOtp: code,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    console.error("OTP send failed", error);
    return NextResponse.json({ error: describeDatabaseError(error) }, { status: 503 });
  }
}
