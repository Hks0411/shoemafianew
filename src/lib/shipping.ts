import { DEFAULT_SETTINGS, type StoreSettings } from "@/lib/store";

export type CheckoutPaymentMethod = "COD" | "RAZORPAY";

export function courierChargeForMethod(
  method: CheckoutPaymentMethod,
  settings: Pick<StoreSettings, "codCourierCharge" | "prepaidCourierCharge"> = DEFAULT_SETTINGS,
): number {
  const raw =
    method === "COD"
      ? settings.codCourierCharge ?? DEFAULT_SETTINGS.codCourierCharge
      : settings.prepaidCourierCharge ?? DEFAULT_SETTINGS.prepaidCourierCharge;
  const amount = Number(raw);
  return Number.isFinite(amount) && amount > 0 ? amount : 0;
}
