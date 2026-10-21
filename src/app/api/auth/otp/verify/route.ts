import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { normalizePhone, verifyCustomerOtp } from "@/lib/auth/customer-otp";
import { setCustomerSession } from "@/lib/auth/customer-session";
import { rateLimit, clientKey } from "@/lib/security/rate-limit";

const schema = z.object({
  phone: z.string().min(10).max(15),
  otp: z.string().regex(/^\d{6}$/),
});

export async function POST(request: Request) {
  const limited = rateLimit(clientKey(request, "otp-verify"), 10, 60_000);
  if (!limited.ok) return NextResponse.json({ error: "Too many attempts. Try again shortly." }, { status: 429 });

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Enter the 6-digit OTP" }, { status: 400 });

  const phone = normalizePhone(parsed.data.phone);
  if (!phone) return NextResponse.json({ error: "Invalid mobile number" }, { status: 400 });

  const ok = await verifyCustomerOtp(phone, parsed.data.otp);
  if (!ok) return NextResponse.json({ error: "OTP is wrong or expired. Send a new one." }, { status: 401 });

  const customer = await prisma.customer.upsert({
    where: { phone },
    create: { phone, name: "" },
    update: {},
  });

  await setCustomerSession(customer.id, phone);

  return NextResponse.json({
    ok: true,
    customer: {
      id: customer.id,
      phone: customer.phone,
      name: customer.name,
      email: customer.email,
      addressLocked: customer.addressLocked,
      hasAddress: Boolean(customer.addressLine && customer.pincode),
    },
  });
}
