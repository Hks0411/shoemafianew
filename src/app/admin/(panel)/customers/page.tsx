"use client";

import { useEffect, useState } from "react";

type Customer = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  createdAt: string;
  _count: { orders: number };
};

export default function CustomersPage() {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);

  async function load() {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    const res = await fetch(`/api/admin/customers?${params}`);
    const data = await res.json();
    setItems(data.items || []);
    setTotal(data.total || 0);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <h1 className="display text-3xl text-forest">Customers</h1>
      <form
        className="mt-6 flex gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          load();
        }}
      >
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, phone, or email" className="w-full max-w-md rounded-xl border border-line px-3 py-2" />
        <button className="rounded-xl bg-forest px-4 text-white">Search</button>
      </form>
      <p className="mt-4 text-sm text-muted">{total} customers</p>
      <div className="mt-4 overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-mint">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Phone</th>
              <th className="p-3">Email</th>
              <th className="p-3">Orders</th>
            </tr>
          </thead>
          <tbody>
            {items.map((customer) => (
              <tr key={customer.id} className="border-t border-line">
                <td className="p-3">{customer.name}</td>
                <td className="p-3">{customer.phone}</td>
                <td className="p-3">{customer.email || "—"}</td>
                <td className="p-3">{customer._count.orders}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!items.length ? <p className="p-6 text-center text-muted">No customers yet.</p> : null}
      </div>
    </div>
  );
}
