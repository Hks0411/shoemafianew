import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCustomerSession } from "@/lib/auth/customer-session";

export async function requireCustomer() {
  const session = await getCustomerSession();
  if (!session) return { customer: null, response: NextResponse.json({ error: "Sign in required" }, { status: 401 }) };
  const customer = await prisma.customer.findUnique({ where: { id: session.customerId } });
  if (!customer || customer.phone !== session.phone) {
    return { customer: null, response: NextResponse.json({ error: "Sign in required" }, { status: 401 }) };
  }
  return { customer, response: null as NextResponse | null };
}
