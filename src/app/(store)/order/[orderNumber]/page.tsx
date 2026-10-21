"use client";

import { useParams } from "next/navigation";
import { useState } from "react";

export default function OrderConfirmationPage() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const [phone, setPhone] = useState("");
  const [order, setOrder] = useState<any>(null);
  const [error, setError] = useState("");

  async function lookup() {
    const res = await fetch(`/api/orders/track?orderNumber=${orderNumber}&phone=${phone}`);
    const data = await res.json();
    if (!res.ok) setError(data.error || "Not found");
    else {
      setError("");
      setOrder(data);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="display text-4xl text-forest">Order placed</h1>
      <p className="mt-3">Your order number is <strong>{orderNumber}</strong>.</p>
      <p className="mt-2 text-sm text-muted">Enter the mobile number used at checkout to view details.</p>
      <div className="mt-6 flex gap-3">
        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Mobile number" className="flex-1 rounded-xl border border-line px-3 py-2" />
        <button onClick={lookup} className="rounded-full bg-forest px-4 py-2 text-white">View</button>
      </div>
      {error ? <p className="mt-4 text-red-700">{error}</p> : null}
      {order ? (
        <div className="soft-card mt-6 p-6 text-sm">
          <p>Status: {order.status}</p>
          <p>Deliver to {order.customerName}, {order.addressLine}, {order.city}</p>
          <ul className="mt-3 space-y-1">
            {order.items.map((item: any) => (
              <li key={item.id}>{item.productName} · size {item.size} × {item.quantity}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
