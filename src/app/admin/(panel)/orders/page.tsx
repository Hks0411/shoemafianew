"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatInr } from "@/lib/money";

const STATUSES = [
  "",
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
  customerName: string;
  customerPhone: string;
  status: string;
  total: number;
  createdAt: string;
  payments: Array<{ status: string; method: string }>;
};

export default function AdminOrdersPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [items, setItems] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  async function load(nextPage = 1) {
    const params = new URLSearchParams({ page: String(nextPage) });
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    const res = await fetch(`/api/admin/orders?${params}`);
    const data = await res.json();
    setItems(data.items || []);
    setTotal(data.total || 0);
    setPage(data.page || 1);
  }

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="display text-3xl text-forest">Orders</h1>
        <a href="/api/admin/export/orders" className="rounded-full border border-line px-4 py-2 text-sm">Export CSV</a>
      </div>
      <form
        className="mt-6 grid gap-3 rounded-2xl border border-line bg-white p-4 md:grid-cols-3"
        onSubmit={(e) => {
          e.preventDefault();
          load(1);
        }}
      >
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Order no, name, or mobile" className="rounded-xl border border-line px-3 py-2" />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-xl border border-line px-3 py-2">
          {STATUSES.map((value) => (
            <option key={value || "all"} value={value}>{value || "All statuses"}</option>
          ))}
        </select>
        <button className="rounded-xl bg-forest text-white">Search</button>
      </form>
      <p className="mt-4 text-sm text-muted">{total} orders</p>
      <div className="mt-4 overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-mint">
            <tr>
              <th className="p-3">Order</th>
              <th className="p-3">Customer</th>
              <th className="p-3">Status</th>
              <th className="p-3">Payment</th>
              <th className="p-3">Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((order) => (
              <tr key={order.id} className="border-t border-line">
                <td className="p-3">
                  <Link href={`/admin/orders/${order.id}`} className="font-medium text-forest">{order.orderNumber}</Link>
                  <p className="text-xs text-muted">{new Date(order.createdAt).toLocaleString("en-IN")}</p>
                </td>
                <td className="p-3">{order.customerName}<br />{order.customerPhone}</td>
                <td className="p-3">{order.status}</td>
                <td className="p-3">{order.payments[0] ? `${order.payments[0].method} ${order.payments[0].status}` : "—"}</td>
                <td className="p-3">{formatInr(Number(order.total))}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!items.length ? <p className="p-6 text-center text-muted">No orders yet.</p> : null}
      </div>
      <div className="mt-4 flex gap-2">
        <button disabled={page <= 1} onClick={() => load(page - 1)} className="rounded-full border border-line px-4 py-1">Previous</button>
        <button disabled={page * 20 >= total} onClick={() => load(page + 1)} className="rounded-full border border-line px-4 py-1">Next</button>
      </div>
    </div>
  );
}
