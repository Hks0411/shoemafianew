import { NextResponse } from "next/server";
import { getStoreSettings } from "@/lib/settings";
import { STORE } from "@/lib/store";
import { razorpayConfigured } from "@/lib/razorpay";

export async function GET() {
  const settings = await getStoreSettings();
  return NextResponse.json({
    shippingCharge: settings.shippingCharge,
    freeShippingAbove: settings.freeShippingAbove,
    paymentsEnabled: settings.paymentsEnabled && razorpayConfigured(),
    store: STORE,
  });
}
