"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatInr } from "@/lib/money";

type Dash = {
  totalOrders: number;
  pendingOrders: number;
  paidOrderCount: number;
  totalSales: number;
  productCount: number;
  variationCount: number;
  lowStock: Array<{ id: string; size: string; available: number; product: { name: string; id: string } }>;
  recentOrders: Array<{ id: string; orderNumber: string; customerName: string; total: number; status: string }>;
  importJobs: Array<{ id: string; filename: string; status: string; processedRows: number; totalRows: number }>;
};

export default function AdminDashboardPage() {
  const [data, setData] = useState<Dash | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/dashboard")
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Could not load dashboard");
        setData(json);
      })
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <p className="text-red-700">{error}</p>;
  if (!data) return <p className="text-muted">Loading dashboard…</p>;

  const cards = [
    { label: "Orders", value: data.totalOrders, href: "/admin/orders" },
    { label: "Pending", value: data.pendingOrders, href: "/admin/orders?status=PENDING_CONFIRMATION" },
    { label: "Paid orders", value: data.paidOrderCount, href: "/admin/orders" },
    { label: "Sales", value: formatInr(Number(data.totalSales || 0)), href: "/admin/orders" },
    { label: "Products", value: data.productCount, href: "/admin/products" },
    { label: "Size variations", value: data.variationCount, href: "/admin/products" },
  ];

  return (
    <div>
      <h1 className="display text-3xl text-forest">Dashboard</h1>
      <p className="mt-1 text-sm text-muted">Live store figures from MySQL. Empty values mean no orders or products yet.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Link key={card.label} href={card.href} className="soft-card p-5">
            <p className="text-sm text-muted">{card.label}</p>
            <p className="mt-2 text-2xl font-semibold text-forest">{card.value}</p>
          </Link>
        ))}
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="soft-card p-5">
          <h2 className="font-semibold text-forest">Low stock</h2>
          {!data.lowStock.length ? (
            <p className="mt-3 text-sm text-muted">No low-stock variations.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {data.lowStock.map((row) => (
                <li key={row.id}>
                  <Link href={`/admin/products/${row.product.id}`} className="text-emerald">
                    {row.product.name} · size {row.size} · {row.available} left
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="soft-card p-5">
          <h2 className="font-semibold text-forest">Recent orders</h2>
          {!data.recentOrders.length ? (
            <p className="mt-3 text-sm text-muted">No orders yet.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {data.recentOrders.map((order) => (
                <li key={order.id}>
                  <Link href={`/admin/orders/${order.id}`} className="text-emerald">
                    {order.orderNumber} · {order.customerName} · {formatInr(Number(order.total))} · {order.status}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
      <section className="soft-card mt-6 p-5">
        <h2 className="font-semibold text-forest">Recent Busy imports</h2>
        {!data.importJobs.length ? (
          <p className="mt-3 text-sm text-muted">No import jobs yet.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {data.importJobs.map((job) => (
              <li key={job.id}>
                <Link href={`/admin/import/${job.id}`} className="text-emerald">
                  {job.filename} · {job.status} · {job.processedRows}/{job.totalRows}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
