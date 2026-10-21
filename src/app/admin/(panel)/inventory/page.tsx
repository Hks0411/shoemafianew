"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

type Hit = {
  id: string;
  name: string;
  itemCode: string | null;
  variations: Array<{ id: string; size: string; barcode: string | null; sku: string | null; available: number; stock: number; reserved: number }>;
};

export default function InventoryPage() {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<Hit[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function search(event?: FormEvent) {
    event?.preventDefault();
    setBusy(true);
    setError("");
    const params = new URLSearchParams({ q, page: "1", pageSize: "20" });
    const res = await fetch(`/api/admin/products?${params}`);
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Could not search inventory");
      return;
    }
    setItems(data.items);
    setTotal(data.total);
  }

  return (
    <div>
      <h1 className="display text-3xl text-forest">Inventory</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        Scan or type a barcode, SKU, item code, or product name. A barcode match shows the parent product, size, and available stock.
      </p>
      <form onSubmit={search} className="mt-6 flex flex-wrap gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          autoFocus
          placeholder="Barcode, SKU, item code, or name"
          className="min-w-[240px] flex-1 rounded-full border border-line px-4 py-2.5"
        />
        <button disabled={busy} className="rounded-full bg-forest px-5 py-2.5 text-white">
          {busy ? "Searching…" : "Search"}
        </button>
      </form>
      {error ? <p className="mt-4 text-red-700">{error}</p> : null}
      <p className="mt-4 text-sm text-muted">{total} matching products</p>
      <div className="mt-4 space-y-3">
        {items.map((product) => (
          <article key={product.id} className="soft-card p-5">
            <Link href={`/admin/products/${product.id}`} className="font-semibold text-forest">
              {product.name}
            </Link>
            <p className="text-xs text-muted">Item code {product.itemCode || "—"}</p>
            <table className="mt-3 w-full text-left text-sm">
              <thead>
                <tr className="text-muted">
                  <th className="py-1">Size</th>
                  <th>Barcode</th>
                  <th>SKU</th>
                  <th>Available</th>
                  <th>Reserved</th>
                  <th>On hand</th>
                </tr>
              </thead>
              <tbody>
                {product.variations.map((row) => (
                  <tr key={row.id} className="border-t border-line">
                    <td className="py-1 font-medium">{row.size}</td>
                    <td className="font-mono">{row.barcode || "—"}</td>
                    <td>{row.sku || "—"}</td>
                    <td>{row.available}</td>
                    <td>{row.reserved}</td>
                    <td>{row.stock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </article>
        ))}
      </div>
    </div>
  );
}
