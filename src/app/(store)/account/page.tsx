"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatInr } from "@/lib/money";

type Customer = {
  phone: string;
  name: string;
  email: string | null;
  addressLine: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  addressLocked: boolean;
  hasAddress: boolean;
};

type OrderRow = {
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
  paymentStatus: string;
  items: Array<{ productName: string; size: string; quantity: number }>;
};

export default function AccountPage() {
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    addressLine: "",
    city: "Bilaspur",
    state: "Chhattisgarh",
    pincode: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    async function load() {
      const session = await fetch("/api/customer/session");
      if (!session.ok) {
        router.replace("/account/login?next=/account");
        return;
      }
      const data = await session.json();
      const c = data.customer as Customer;
      setCustomer(c);
      setProfile({
        name: c.name || "",
        email: c.email || "",
        addressLine: c.addressLine || "",
        city: c.city || "Bilaspur",
        state: c.state || "Chhattisgarh",
        pincode: c.pincode || "",
      });
      const ordersRes = await fetch("/api/customer/orders");
      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        setOrders(ordersData.orders || []);
      }
    }
    void load();
  }, [router]);

  async function saveProfile(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    const body = customer.addressLocked
      ? { name: profile.name, email: profile.email }
      : profile;
    const res = await fetch("/api/customer/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Could not save");
      return;
    }
    setCustomer(data.customer);
    setMessage(data.customer.addressLocked ? "Profile saved. Address is now locked." : "Profile saved.");
  }

  async function logout() {
    await fetch("/api/customer/logout", { method: "POST" });
    router.replace("/account/login");
  }

  if (!customer) {
    return <p className="p-8 text-center text-muted">Loading your account…</p>;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="display text-3xl text-forest">My account</h1>
          <p className="text-sm text-muted">Signed in · {customer.phone}</p>
        </div>
        <button type="button" onClick={logout} className="rounded-full border border-line px-4 py-2 text-sm">
          Sign out
        </button>
      </div>

      <form onSubmit={saveProfile} className="soft-card mt-8 space-y-3 p-6">
        <h2 className="font-semibold text-forest">Profile & delivery address</h2>
        <input
          required
          minLength={2}
          placeholder="Full name"
          value={profile.name}
          onChange={(e) => setProfile({ ...profile, name: e.target.value })}
          className="w-full rounded-xl border border-line px-3 py-2"
        />
        <input
          type="email"
          placeholder="Email (optional)"
          value={profile.email}
          onChange={(e) => setProfile({ ...profile, email: e.target.value })}
          className="w-full rounded-xl border border-line px-3 py-2"
        />
        {customer.addressLocked ? (
          <div className="rounded-xl border border-line bg-cream p-4 text-sm">
            <p className="font-medium text-forest">Delivery address (locked)</p>
            <p className="mt-2 whitespace-pre-wrap text-muted">
              {customer.addressLine}
              {"\n"}
              {customer.city}, {customer.state} — {customer.pincode}
            </p>
            <p className="mt-2 text-xs text-muted">Address cannot be changed online. Contact the store to update it.</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted">Save your address once. After that it cannot be edited here.</p>
            <textarea
              required
              minLength={8}
              placeholder="Complete delivery address"
              value={profile.addressLine}
              onChange={(e) => setProfile({ ...profile, addressLine: e.target.value })}
              className="w-full rounded-xl border border-line px-3 py-2"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                required
                placeholder="City"
                value={profile.city}
                onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                className="rounded-xl border border-line px-3 py-2"
              />
              <input
                required
                placeholder="State"
                value={profile.state}
                onChange={(e) => setProfile({ ...profile, state: e.target.value })}
                className="rounded-xl border border-line px-3 py-2"
              />
            </div>
            <input
              required
              pattern="[0-9]{6}"
              placeholder="PIN code"
              value={profile.pincode}
              onChange={(e) => setProfile({ ...profile, pincode: e.target.value })}
              className="w-full rounded-xl border border-line px-3 py-2"
            />
          </>
        )}
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        {message ? <p className="text-sm text-emerald">{message}</p> : null}
        <button disabled={busy} className="rounded-full bg-forest px-5 py-2 text-white disabled:opacity-60">
          {busy ? "Saving…" : "Save profile"}
        </button>
      </form>

      <section className="soft-card mt-8 p-6">
        <h2 className="font-semibold text-forest">Your orders</h2>
        {!orders.length ? (
          <p className="mt-4 text-sm text-muted">
            No orders yet.{" "}
            <Link href="/shop" className="text-emerald underline">
              Start shopping
            </Link>
          </p>
        ) : (
          <ul className="mt-4 space-y-4">
            {orders.map((order) => (
              <li key={order.orderNumber} className="rounded-xl border border-line p-4 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Link href={`/order/${order.orderNumber}`} className="font-semibold text-forest underline">
                    {order.orderNumber}
                  </Link>
                  <span className="text-muted">{new Date(order.createdAt).toLocaleString()}</span>
                </div>
                <p className="mt-1">
                  {order.status.replaceAll("_", " ")} · {formatInr(order.total)} · {order.paymentStatus}
                </p>
                <ul className="mt-2 text-muted">
                  {order.items.map((item, i) => (
                    <li key={i}>
                      {item.productName} · size {item.size} × {item.quantity}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
