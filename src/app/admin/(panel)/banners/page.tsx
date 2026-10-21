"use client";

import { FormEvent, useEffect, useState } from "react";

type Banner = {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string;
  href: string | null;
  active: boolean;
};

export default function BannersPage() {
  const [items, setItems] = useState<Banner[]>([]);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [storedImageId, setStoredImageId] = useState("");
  const [href, setHref] = useState("/shop");
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch("/api/admin/banners");
    setItems(await res.json());
  }

  useEffect(() => {
    load();
  }, []);

  async function upload(file: File) {
    const form = new FormData();
    form.set("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: form });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Upload failed. Run npx prisma migrate deploy if this mentions StoredImage.");
      return;
    }
    setImageUrl(data.url);
    setStoredImageId(data.storedImageId || "");
  }

  async function add(event: FormEvent) {
    event.preventDefault();
    const res = await fetch("/api/admin/banners", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, subtitle, imageUrl, storedImageId: storedImageId || undefined, href }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Could not save banner");
      return;
    }
    setTitle("");
    setSubtitle("");
    setImageUrl("");
    setStoredImageId("");
    load();
  }

  async function remove(id: string) {
    await fetch("/api/admin/banners", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    load();
  }

  return (
    <div>
      <h1 className="display text-3xl text-forest">Homepage banners</h1>
      <form onSubmit={add} className="soft-card mt-6 grid gap-3 p-6">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="rounded-xl border border-line px-3 py-2" required />
        <input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="Subtitle" className="rounded-xl border border-line px-3 py-2" />
        <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="Image URL" className="rounded-xl border border-line px-3 py-2" />
        <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
        <input value={href} onChange={(e) => setHref(e.target.value)} placeholder="Link" className="rounded-xl border border-line px-3 py-2" />
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <button className="rounded-full bg-forest px-4 py-2 text-white">Save banner</button>
      </form>
      <ul className="mt-6 space-y-3">
        {items.map((item) => (
          <li key={item.id} className="soft-card flex items-center gap-4 p-4">
            {item.imageUrl ? <img src={item.imageUrl} alt="" className="h-16 w-24 rounded-lg object-cover" /> : null}
            <div className="flex-1">
              <p className="font-medium">{item.title}</p>
              <p className="text-sm text-muted">{item.subtitle}</p>
            </div>
            <button onClick={() => remove(item.id)} className="text-sm text-muted">Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
