import { NextResponse } from "next/server";
import { requireCustomer } from "@/lib/auth/customer-guard";

export async function GET() {
  const { customer, response } = await requireCustomer();
  if (!customer) return response!;

  return NextResponse.json({
    authenticated: true,
    customer: {
      id: customer.id,
      phone: customer.phone,
      name: customer.name,
      email: customer.email,
      addressLine: customer.addressLine,
      city: customer.city,
      state: customer.state,
      pincode: customer.pincode,
      addressLocked: customer.addressLocked,
      hasAddress: Boolean(customer.addressLine && customer.pincode),
    },
  });
}
