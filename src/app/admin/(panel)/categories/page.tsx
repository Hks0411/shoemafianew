"use client";

import { FormEvent, useEffect, useState } from "react";

type Category = { id: string; name: string; slug: string };

export default function CategoriesPage() {
  const [items, setItems] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch("/api/admin/categories");
    setItems(await res.json());
  }

  useEffect(() => {
    load();
  }, []);

  async function add(event: FormEvent) {
    event.preventDefault();
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Could not add category");
      return;
    }
    setName("");
    load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this category?")) return;
    await fetch("/api/admin/categories", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    load();
  }

  return (
    <div>
      <h1 className="display text-3xl text-forest">Categories</h1>
      <form onSubmit={add} className="mt-6 flex gap-3">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Category name" className="rounded-xl border border-line px-3 py-2" />
        <button className="rounded-full bg-forest px-4 py-2 text-white">Add</button>
      </form>
      {error ? <p className="mt-3 text-red-700">{error}</p> : null}
      <ul className="mt-6 space-y-2">
        {items.map((item) => (
          <li key={item.id} className="soft-card flex items-center justify-between p-4">
            <span>{item.name}</span>
            <button onClick={() => remove(item.id)} className="text-sm text-muted">Delete</button>
          </li>
        ))}
        {!items.length ? <li className="text-muted">No categories yet.</li> : null}
      </ul>
    </div>
  );
}
