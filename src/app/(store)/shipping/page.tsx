import { DEFAULT_SETTINGS } from "@/lib/store";

export default function ShippingPage() {
  const cod = DEFAULT_SETTINGS.codCourierCharge;
  const prepaid = DEFAULT_SETTINGS.prepaidCourierCharge;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="display text-4xl text-forest">Shipping</h1>
      <p className="mt-4 text-muted">
        Orders ship from our Bilaspur store. Courier charges are added at checkout and depend on how you pay:
      </p>
      <ul className="mt-4 list-inside list-disc space-y-2 text-muted">
        <li>
          <strong className="text-forest">Cash on delivery:</strong> ₹{cod} courier charge, plus the price of your shoes.
        </li>
        <li>
          <strong className="text-forest">Prepaid (online):</strong> ₹{prepaid} courier charge on top of your shoe total.
        </li>
      </ul>
      <p className="mt-4 text-muted">Delivery time depends on the courier and your PIN code.</p>
    </div>
  );
}
