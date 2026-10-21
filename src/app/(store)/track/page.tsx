"use client";

import { FormEvent, useState } from "react";
import { formatInr } from "@/lib/money";

export default function TrackPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [order, setOrder] = useState<any>(null);
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const res = await fetch(`/api/orders/track?orderNumber=${encodeURIComponent(orderNumber)}&phone=${encodeURIComponent(phone)}`);
    const data = await res.json();
    if (!res.ok) {
      setOrder(null);
      setError(data.error || "Order not found");
      return;
    }
    setError("");
    setOrder(data);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="display text-4xl text-forest">Track order</h1>
      <form onSubmit={onSubmit} className="mt-6 grid gap-3">
        <input value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} placeholder="Order number" required className="rounded-xl border border-line px-3 py-2" />
        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Mobile number" required className="rounded-xl border border-line px-3 py-2" />
        <button className="rounded-full bg-forest py-3 text-white">Track</button>
      </form>
      {error ? <p className="mt-4 text-red-700">{error}</p> : null}
      {order ? (
        <div className="soft-card mt-6 p-6">
          <p className="font-semibold">{order.orderNumber}</p>
          <p className="text-sm text-muted">{order.status}</p>
          <ul className="mt-4 space-y-2 text-sm">
            {order.items.map((item: any) => (
              <li key={item.id}>{item.productName} · size {item.size} × {item.quantity} · {formatInr(Number(item.lineTotal))}</li>
            ))}
          </ul>
          <p className="mt-4 font-medium">Total {formatInr(Number(order.total))}</p>
        </div>
      ) : null}
    </div>
  );
}
