"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { formatInr } from "@/lib/money";

const STATUSES = [
  "PENDING_CONFIRMATION",
  "CONFIRMED",
  "PROCESSING",
  "PACKED",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
  "RETURNED",
];

type Order = {
  id: string;
  orderNumber: string;
  createdAt: string;
  status: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  subtotal: number;
  shippingCharge: number;
  discount: number;
  total: number;
  items: Array<{
    id: string;
    productName: string;
    size: string;
    sku?: string | null;
    barcode?: string | null;
    imageUrl?: string | null;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
  payments: Array<{
    method: string;
    status: string;
    razorpayOrderId?: string | null;
    razorpayPaymentId?: string | null;
  }>;
};

export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch(`/api/admin/orders/${id}`);
    const data = await res.json();
    if (!res.ok) setError(data.error || "Not found");
    else setOrder(data);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function updateStatus(status: string) {
    const res = await fetch(`/api/admin/orders/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (!res.ok) setError(data.error || "Could not update");
    else setOrder(data);
  }

  if (error) return <p className="text-red-700">{error}</p>;
  if (!order) return <p className="text-muted">Loading order…</p>;
  const payment = order.payments[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="display text-3xl text-forest">{order.orderNumber}</h1>
          <p className="text-sm text-muted">{new Date(order.createdAt).toLocaleString("en-IN")}</p>
        </div>
        <a href={`/admin/orders/${order.id}/print`} target="_blank" className="rounded-full border border-line px-4 py-2 text-sm">
          Print invoice
        </a>
      </div>
      <section className="soft-card p-6">
        <h2 className="font-semibold text-forest">Customer details</h2>
        <p className="mt-3">{order.customerName}</p>
        <p>{order.customerPhone}</p>
        {order.customerEmail ? <p>{order.customerEmail}</p> : null}
        <p className="mt-2">{order.addressLine}</p>
        <p>{order.city}, {order.state} {order.pincode}</p>
      </section>
      <section className="soft-card p-6">
        <h2 className="font-semibold text-forest">Order details</h2>
        <div className="mt-4 space-y-3">
          {order.items.map((item) => (
            <div key={item.id} className="flex gap-3 border-b border-line pb-3">
              <div className="h-16 w-16 overflow-hidden rounded-xl bg-mint">
                {item.imageUrl ? <img src={item.imageUrl} alt="" className="h-full w-full object-cover" /> : null}
              </div>
              <div className="flex-1 text-sm">
                <p className="font-medium">{item.productName}</p>
                <p>Size {item.size} · Qty {item.quantity}</p>
                <p>SKU {item.sku || "—"} · Barcode {item.barcode || "—"}</p>
              </div>
              <div className="text-right text-sm">
                <p>{formatInr(Number(item.unitPrice))}</p>
                <p className="font-medium">{formatInr(Number(item.lineTotal))}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 space-y-1 text-sm">
          <p>Subtotal {formatInr(Number(order.subtotal))}</p>
          <p>Shipping {formatInr(Number(order.shippingCharge))}</p>
          <p>Discount {formatInr(Number(order.discount))}</p>
          <p className="text-lg font-semibold">Total {formatInr(Number(order.total))}</p>
        </div>
      </section>
      <section className="soft-card p-6">
        <h2 className="font-semibold text-forest">Payment details</h2>
        {payment ? (
          <div className="mt-3 space-y-1 text-sm">
            <p>Method {payment.method}</p>
            <p>Status {payment.status}</p>
            {payment.razorpayOrderId ? <p>Razorpay order {payment.razorpayOrderId}</p> : null}
            {payment.razorpayPaymentId ? <p>Razorpay payment {payment.razorpayPaymentId}</p> : null}
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted">No payment record.</p>
        )}
      </section>
      <section className="soft-card p-6">
        <h2 className="font-semibold text-forest">Fulfilment status</h2>
        <select value={order.status} onChange={(e) => updateStatus(e.target.value)} className="mt-3 rounded-xl border border-line px-3 py-2">
          {STATUSES.map((status) => (
            <option key={status} value={status}>{status.replaceAll("_", " ")}</option>
          ))}
        </select>
      </section>
    </div>
  );
}
