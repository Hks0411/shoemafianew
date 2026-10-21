import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireCustomer } from "@/lib/auth/customer-guard";

const schema = z.object({
  name: z.string().min(2).max(80).optional(),
  email: z.string().email().optional().or(z.literal("")),
  addressLine: z.string().min(8).max(300).optional(),
  city: z.string().min(2).max(80).optional(),
  state: z.string().min(2).max(80).optional(),
  pincode: z.string().regex(/^\d{6}$/).optional(),
});

export async function PUT(request: Request) {
  const { customer, response } = await requireCustomer();
  if (!customer) return response!;

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid details" }, { status: 400 });
  }

  const data: {
    name?: string;
    email?: string | null;
    addressLine?: string;
    city?: string;
    state?: string;
    pincode?: string;
    addressLocked?: boolean;
  } = {};

  if (parsed.data.name) data.name = parsed.data.name;
  if (parsed.data.email !== undefined) data.email = parsed.data.email || null;

  if (customer.addressLocked) {
    if (parsed.data.addressLine || parsed.data.city || parsed.data.state || parsed.data.pincode) {
      return NextResponse.json(
        { error: "Delivery address cannot be changed after it is saved. Contact the store for help." },
        { status: 403 },
      );
    }
  } else if (parsed.data.addressLine && parsed.data.city && parsed.data.state && parsed.data.pincode) {
    data.addressLine = parsed.data.addressLine;
    data.city = parsed.data.city;
    data.state = parsed.data.state;
    data.pincode = parsed.data.pincode;
    data.addressLocked = true;
  }

  const updated = await prisma.customer.update({
    where: { id: customer.id },
    data,
  });

  return NextResponse.json({
    customer: {
      id: updated.id,
      phone: updated.phone,
      name: updated.name,
      email: updated.email,
      addressLine: updated.addressLine,
      city: updated.city,
      state: updated.state,
      pincode: updated.pincode,
      addressLocked: updated.addressLocked,
      hasAddress: Boolean(updated.addressLine && updated.pincode),
    },
  });
}
