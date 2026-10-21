"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatInr, fromDecimal } from "@/lib/money";

type Product = {
  id: string;
  name: string;
  itemCode: string | null;
  status: string;
  featured: boolean;
  images: Array<{ url: string }>;
  variations: Array<{ size: string; barcode: string | null; available: number; price: number }>;
};

export default function AdminProductsPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [lowStock, setLowStock] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [items, setItems] = useState<Product[]>([]);
  const [error, setError] = useState("");

  async function load(nextPage = page) {
    const params = new URLSearchParams({ page: String(nextPage), pageSize: "20" });
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    if (lowStock) params.set("lowStock", "1");
    const res = await fetch(`/api/admin/products?${params}`);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Could not load products");
      return;
    }
    setItems(data.items);
    setTotal(data.total);
    setPage(data.page);
  }

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="display text-3xl text-forest">Products</h1>
        <div className="flex gap-2">
          <a href="/api/admin/export/products" className="rounded-full border border-line px-4 py-2 text-sm">
            Export CSV
          </a>
          <Link href="/admin/products/new" className="rounded-full bg-forest px-4 py-2 text-sm text-white">
            Add product
          </Link>
        </div>
      </div>
      <form
        className="mt-6 grid gap-3 rounded-2xl border border-line bg-white p-4 md:grid-cols-4"
        onSubmit={(e) => {
          e.preventDefault();
          load(1);
        }}
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, barcode, SKU, item code"
          className="rounded-xl border border-line px-3 py-2"
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-xl border border-line px-3 py-2">
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="DRAFT">Draft</option>
          <option value="ARCHIVED">Archived</option>
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={lowStock} onChange={(e) => setLowStock(e.target.checked)} />
          Low stock
        </label>
        <button className="rounded-xl bg-forest px-3 py-2 text-white">Search</button>
      </form>
      {error ? <p className="mt-4 text-red-700">{error}</p> : null}
      <p className="mt-4 text-sm text-muted">{total} products</p>
      <div className="mt-4 overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-mint text-forest">
            <tr>
              <th className="p-3">Product</th>
              <th className="p-3">Sizes</th>
              <th className="p-3">Stock</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {items.map((product) => (
              <tr key={product.id} className="border-t border-line">
                <td className="p-3">
                  <Link href={`/admin/products/${product.id}`} className="font-medium text-forest">
                    {product.name}
                  </Link>
                  <p className="text-xs text-muted">{product.itemCode || "No item code"}</p>
                </td>
                <td className="p-3">{product.variations.map((v) => v.size).join(", ") || "—"}</td>
                <td className="p-3">{product.variations.reduce((sum, v) => sum + v.available, 0)}</td>
                <td className="p-3">
                  {product.status}
                  {product.variations[0] ? ` · from ${formatInr(fromDecimal(product.variations[0].price))}` : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!items.length ? <p className="p-6 text-center text-muted">No products yet. Add one or import from Busy.</p> : null}
      </div>
      <div className="mt-4 flex gap-2">
        <button disabled={page <= 1} onClick={() => load(page - 1)} className="rounded-full border border-line px-4 py-1 disabled:opacity-40">
          Previous
        </button>
        <button disabled={page * 20 >= total} onClick={() => load(page + 1)} className="rounded-full border border-line px-4 py-1 disabled:opacity-40">
          Next
        </button>
      </div>
    </div>
  );
}
