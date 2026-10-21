"use client";

import { FormEvent, useEffect, useState } from "react";

type Item = { id: string; authorName: string; rating: number; body: string; published: boolean };

export default function TestimonialsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [authorName, setAuthorName] = useState("");
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");

  async function load() {
    const res = await fetch("/api/admin/testimonials");
    setItems(await res.json());
  }

  useEffect(() => {
    load();
  }, []);

  async function add(event: FormEvent) {
    event.preventDefault();
    await fetch("/api/admin/testimonials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ authorName, rating, body }),
    });
    setAuthorName("");
    setBody("");
    load();
  }

  async function remove(id: string) {
    await fetch("/api/admin/testimonials", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    load();
  }

  return (
    <div>
      <h1 className="display text-3xl text-forest">Testimonials</h1>
      <p className="mt-2 text-sm text-muted">Add only real customer quotes. Do not paste Google reviews as if they were collected here.</p>
      <form onSubmit={add} className="soft-card mt-6 grid gap-3 p-6">
        <input value={authorName} onChange={(e) => setAuthorName(e.target.value)} placeholder="Customer name" required className="rounded-xl border border-line px-3 py-2" />
        <select value={rating} onChange={(e) => setRating(Number(e.target.value))} className="rounded-xl border border-line px-3 py-2">
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>{n} stars</option>
          ))}
        </select>
        <textarea value={body} onChange={(e) => setBody(e.target.value)} required rows={4} className="rounded-xl border border-line px-3 py-2" />
        <button className="rounded-full bg-forest px-4 py-2 text-white">Add testimonial</button>
      </form>
      <ul className="mt-6 space-y-3">
        {items.map((item) => (
          <li key={item.id} className="soft-card p-5">
            <p className="font-medium">{item.authorName} · {"★".repeat(item.rating)}</p>
            <p className="mt-2">{item.body}</p>
            <button onClick={() => remove(item.id)} className="mt-3 text-sm text-muted">Remove</button>
          </li>
        ))}
        {!items.length ? <li className="empty-state">No testimonials yet.</li> : null}
      </ul>
    </div>
  );
}
