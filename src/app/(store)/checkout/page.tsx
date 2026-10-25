"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { readCart, writeCart, type CartItem } from "@/lib/cart";
import { formatInr } from "@/lib/money";
import { STORE } from "@/lib/store";
import { courierChargeForMethod, type CheckoutPaymentMethod } from "@/lib/shipping";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

type CustomerSession = {
  phone: string;
  name: string;
  email: string | null;
  addressLine: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  addressLocked: boolean;
};

export default function CheckoutPage() {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [courierRates, setCourierRates] = useState({ cod: 200, prepaid: 150 });
  const [paymentsEnabled, setPaymentsEnabled] = useState(false);
  const [method, setMethod] = useState<CheckoutPaymentMethod>("COD");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [customer, setCustomer] = useState<CustomerSession | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [form, setForm] = useState({
    customerName: "",
    customerEmail: "",
    addressLine: "",
    city: "Bilaspur",
    state: "Chhattisgarh",
    pincode: "",
    notes: "",
  });

  useEffect(() => {
    setItems(readCart());
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        setCourierRates({
          cod: Number(data.codCourierCharge ?? 200),
          prepaid: Number(data.prepaidCourierCharge ?? 150),
        });
        setPaymentsEnabled(Boolean(data.paymentsEnabled));
      })
      .catch(() => undefined);

    fetch("/api/customer/session")
      .then(async (res) => {
        if (!res.ok) {
          router.replace("/account/login?next=/checkout");
          return;
        }
        const data = await res.json();
        const c = data.customer as CustomerSession;
        setCustomer(c);
        setForm({
          customerName: c.name || "",
          customerEmail: c.email || "",
          addressLine: c.addressLine || "",
          city: c.city || "Bilaspur",
          state: c.state || "Chhattisgarh",
          pincode: c.pincode || "",
          notes: "",
        });
      })
      .finally(() => setAuthChecked(true));
  }, [router]);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const checkoutMethod: CheckoutPaymentMethod = paymentsEnabled ? method : "COD";
  const courier = courierChargeForMethod(checkoutMethod, {
    codCourierCharge: courierRates.cod,
    prepaidCourierCharge: courierRates.prepaid,
  });
  const total = courier + subtotal;

  async function placeOrder(event: FormEvent) {
    event.preventDefault();
    if (!items.length || !customer) return;
    setBusy(true);
    setError("");

    const payload: Record<string, unknown> = {
      ...form,
      method: paymentsEnabled ? method : "COD",
      items: items.map((item) => ({ variationId: item.variationId, quantity: item.quantity })),
    };

    if (customer.addressLocked) {
      delete payload.addressLine;
      delete payload.city;
      delete payload.state;
      delete payload.pincode;
    }

    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      setBusy(false);
      if (data.code === "AUTH_REQUIRED") {
        router.replace("/account/login?next=/checkout");
        return;
      }
      setError(data.error || "Could not place order");
      return;
    }

    if (paymentsEnabled && method === "RAZORPAY") {
      const pay = await fetch("/api/payments/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: data.orderId }),
      });
      const payData = await pay.json();
      if (!pay.ok) {
        setBusy(false);
        setError(payData.error || "Online payment is not activated yet.");
        return;
      }
      await openRazorpay(payData, data.orderId, form.customerName, customer.phone);
      return;
    }

    writeCart([]);
    router.replace(`/order/${data.orderNumber}`);
  }

  async function openRazorpay(
    payData: { keyId: string; razorpayOrderId: string; amount: number; currency: string; orderNumber: string },
    orderId: string,
    name: string,
    phone: string,
  ) {
    await loadRazorpay();
    const checkout = new window.Razorpay!({
      key: payData.keyId,
      amount: payData.amount,
      currency: payData.currency,
      name: STORE.name,
      image: `${window.location.origin}/brand/logo.png`,
      order_id: payData.razorpayOrderId,
      prefill: { name, contact: phone },
      handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
        const verify = await fetch("/api/payments/razorpay/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...response, orderId }),
        });
        if (!verify.ok) {
          setBusy(false);
          setError("Payment could not be verified.");
          return;
        }
        writeCart([]);
        router.replace(`/order/${payData.orderNumber}`);
      },
    });
    checkout.open();
    setBusy(false);
  }

  if (!authChecked) {
    return <div className="mx-auto max-w-3xl px-4 py-16 text-center text-muted">Checking sign in…</div>;
  }

  if (!items.length) {
    return <div className="mx-auto max-w-3xl px-4 py-16 empty-state">Your cart is empty.</div>;
  }

  const addressLocked = Boolean(customer?.addressLocked);

  return (
    <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 md:grid-cols-2">
      <form onSubmit={placeOrder} className="space-y-3">
        <h1 className="display text-4xl text-forest">Checkout</h1>
        <p className="text-sm text-muted">
          Signed in as {customer?.phone}.{" "}
          <Link href="/account" className="text-emerald underline">
            My account
          </Link>
        </p>
        <input
          required
          minLength={2}
          placeholder="Full name"
          value={form.customerName}
          onChange={(e) => setForm({ ...form, customerName: e.target.value })}
          className="w-full rounded-xl border border-line px-3 py-2"
        />
        <input
          type="email"
          placeholder="Email (optional)"
          value={form.customerEmail}
          onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
          className="w-full rounded-xl border border-line px-3 py-2"
        />
        {addressLocked ? (
          <div className="rounded-xl border border-line bg-cream p-4 text-sm">
            <p className="font-medium text-forest">Delivery address (locked)</p>
            <p className="mt-2 whitespace-pre-wrap text-muted">
              {customer?.addressLine}
              {"\n"}
              {customer?.city}, {customer?.state} — {customer?.pincode}
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted">First checkout saves and locks this address.</p>
            <textarea
              required
              minLength={8}
              placeholder="Complete delivery address"
              value={form.addressLine}
              onChange={(e) => setForm({ ...form, addressLine: e.target.value })}
              className="w-full rounded-xl border border-line px-3 py-2"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                required
                placeholder="City"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="rounded-xl border border-line px-3 py-2"
              />
              <input
                required
                placeholder="State"
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                className="rounded-xl border border-line px-3 py-2"
              />
            </div>
            <input
              required
              pattern="[0-9]{6}"
              placeholder="PIN code"
              value={form.pincode}
              onChange={(e) => setForm({ ...form, pincode: e.target.value })}
              className="w-full rounded-xl border border-line px-3 py-2"
            />
          </>
        )}
        <textarea
          placeholder="Notes"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          className="w-full rounded-xl border border-line px-3 py-2"
        />
        <label className="flex items-center gap-2 text-sm">
          <input type="radio" checked={method === "COD"} onChange={() => setMethod("COD")} />
          Cash on delivery · courier {formatInr(courierRates.cod)} + shoes
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="radio" checked={method === "RAZORPAY"} onChange={() => setMethod("RAZORPAY")} disabled={!paymentsEnabled} />
          Prepaid (Razorpay) · courier {formatInr(courierRates.prepaid)} extra
          {paymentsEnabled ? "" : " (not activated yet)"}
        </label>
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <button disabled={busy} className="w-full rounded-full bg-forest py-3 text-white">
          {busy ? "Placing order…" : `Place order · ${formatInr(total)}`}
        </button>
      </form>
      <aside className="soft-card h-fit p-6">
        <h2 className="font-semibold text-forest">Order review</h2>
        <ul className="mt-4 space-y-3 text-sm">
          {items.map((item) => (
            <li key={item.variationId} className="flex justify-between">
              <span>
                {item.name} · size {item.size} × {item.quantity}
              </span>
              <span>{formatInr(item.price * item.quantity)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm">Courier charge {formatInr(courier)}</p>
        <p className="text-sm">Shoes subtotal {formatInr(subtotal)}</p>
        <p className="mt-2 text-lg font-semibold">Payable {formatInr(total)}</p>
      </aside>
    </div>
  );
}

function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve();
  return new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Could not load Razorpay"));
    document.body.appendChild(script);
  });
}
