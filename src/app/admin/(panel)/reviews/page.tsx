"use client";

import { useEffect, useState } from "react";

type Review = {
  id: string;
  authorName: string;
  rating: number;
  body: string;
  status: string;
  verified: boolean;
  product: { name: string } | null;
};

export default function ReviewsPage() {
  const [items, setItems] = useState<Review[]>([]);

  async function load() {
    const res = await fetch("/api/admin/reviews");
    setItems(await res.json());
  }

  useEffect(() => {
    load();
  }, []);

  async function setStatus(id: string, status: string) {
    await fetch("/api/admin/reviews", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    load();
  }

  async function remove(id: string) {
    if (!confirm("Remove this review?")) return;
    await fetch("/api/admin/reviews", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    load();
  }

  return (
    <div>
      <h1 className="display text-3xl text-forest">Reviews</h1>
      <p className="mt-2 text-sm text-muted">Only genuine submitted reviews appear here. Nothing is fabricated.</p>
      <ul className="mt-6 space-y-3">
        {items.map((item) => (
          <li key={item.id} className="soft-card p-5">
            <p className="font-medium">{item.authorName} · {"★".repeat(item.rating)} · {item.status}</p>
            <p className="text-sm text-muted">{item.product?.name || "Store review"} {item.verified ? "· Verified purchase" : ""}</p>
            <p className="mt-2">{item.body}</p>
            <div className="mt-3 flex gap-2 text-sm">
              <button onClick={() => setStatus(item.id, "APPROVED")} className="rounded-full bg-forest px-3 py-1 text-white">Approve</button>
              <button onClick={() => setStatus(item.id, "REJECTED")} className="rounded-full border border-line px-3 py-1">Reject</button>
              <button onClick={() => remove(item.id)} className="rounded-full border border-line px-3 py-1">Remove</button>
            </div>
          </li>
        ))}
        {!items.length ? <li className="empty-state">No customer reviews yet.</li> : null}
      </ul>
    </div>
  );
}
