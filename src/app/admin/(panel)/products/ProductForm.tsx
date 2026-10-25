"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Variation = {
  id?: string;
  size: string;
  sku: string;
  barcode: string;
  price: string;
  salePrice: string;
  stock: string;
};

type Category = { id: string; name: string };
type Image = { id: string; url: string };

const emptyVariation = (): Variation => ({
  size: "",
  sku: "",
  barcode: "",
  price: "",
  salePrice: "",
  stock: "0",
});

export function ProductForm({ productId }: { productId?: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [itemCode, setItemCode] = useState("");
  const [status, setStatus] = useState("ACTIVE");
  const [featured, setFeatured] = useState(false);
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [variations, setVariations] = useState<Variation[]>([emptyVariation()]);
  const [images, setImages] = useState<Image[]>([]);
  const [pendingPhotos, setPendingPhotos] = useState<File[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/admin/categories")
      .then((res) => res.json())
      .then(setCategories)
      .catch(() => setCategories([]));
    if (!productId) return;
    fetch(`/api/admin/products/${productId}`)
      .then((res) => res.json())
      .then((product) => {
        setName(product.name);
        setDescription(product.description || "");
        setItemCode(product.itemCode || "");
        setStatus(product.status);
        setFeatured(Boolean(product.featured));
        setCategoryId(product.categoryId || "");
        setImages(product.images || []);
        setVariations(
          (product.variations || []).map((v: { id: string; size: string; sku?: string; barcode?: string; price: number; salePrice?: number; stock: number }) => ({
            id: v.id,
            size: v.size,
            sku: v.sku || "",
            barcode: v.barcode || "",
            price: String(v.price),
            salePrice: v.salePrice == null ? "" : String(v.salePrice),
            stock: String(v.stock),
          })),
        );
      });
  }, [productId]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    const payload = {
      name,
      description,
      itemCode: itemCode || null,
      status,
      featured,
      categoryId: categoryId || null,
      variations: variations
        .filter((v) => v.size.trim())
        .map((v) => ({
          id: v.id,
          size: v.size.trim(),
          sku: v.sku || null,
          barcode: v.barcode || null,
          price: Number(v.price),
          salePrice: v.salePrice === "" ? null : Number(v.salePrice),
          stock: Number(v.stock || 0),
        })),
    };
    const res = await fetch(productId ? `/api/admin/products/${productId}` : "/api/admin/products", {
      method: productId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Could not save product");
      return;
    }
    const savedId = (productId || data.id) as string;
    const queued = pendingPhotos;
    if (queued.length) {
      setMessage("Saved — uploading photos…");
      for (const file of queued) {
        const form = new FormData();
        form.set("file", file);
        form.set("productId", savedId);
        const up = await fetch("/api/admin/upload", { method: "POST", body: form });
        const uploaded = await up.json();
        if (up.ok) setImages((current) => [...current, uploaded]);
      }
      setPendingPhotos([]);
    }
    setMessage("Saved");
    if (!productId) router.replace(`/admin/products/${savedId}`);
  }

  async function uploadPhoto(file: File, targetProductId?: string) {
    const id = targetProductId || productId;
    if (!id) {
      setPendingPhotos((current) => [...current, file]);
      return;
    }
    const form = new FormData();
    form.set("file", file);
    form.set("productId", id);
    const res = await fetch("/api/admin/upload", { method: "POST", body: form });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Upload failed");
      return;
    }
    setImages((current) => [...current, data]);
  }

  async function removeImage(imageId: string) {
    const res = await fetch("/api/admin/upload", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageId }),
    });
    if (res.ok) setImages((current) => current.filter((img) => img.id !== imageId));
  }

  async function removeProduct(archive: boolean) {
    if (!productId) return;
    if (!confirm(archive ? "Archive this product?" : "Permanently delete this product?")) return;
    const res = await fetch(`/api/admin/products/${productId}${archive ? "?archive=1" : ""}`, { method: "DELETE" });
    if (res.ok) router.replace("/admin/products");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="soft-card grid gap-4 p-6 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="text-sm">Product name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required className="mt-1 w-full rounded-xl border border-line px-3 py-2" />
        </div>
        <div className="md:col-span-2">
          <label className="text-sm">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="mt-1 w-full rounded-xl border border-line px-3 py-2" />
        </div>
        <div>
          <label className="text-sm">Item code</label>
          <input value={itemCode} onChange={(e) => setItemCode(e.target.value)} className="mt-1 w-full rounded-xl border border-line px-3 py-2" />
        </div>
        <div>
          <label className="text-sm">Category</label>
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="mt-1 w-full rounded-xl border border-line px-3 py-2">
            <option value="">None</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm">Availability</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="mt-1 w-full rounded-xl border border-line px-3 py-2">
            <option value="ACTIVE">Active / on sale</option>
            <option value="DRAFT">Draft</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
        <label className="mt-6 flex items-center gap-2 text-sm">
          <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
          Featured on homepage
        </label>
      </div>

      <section className="soft-card p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-forest">Sizes, barcodes, and stock</h2>
          <button type="button" onClick={() => setVariations((rows) => [...rows, emptyVariation()])} className="text-sm text-emerald">
            Add size
          </button>
        </div>
        <div className="mt-4 space-y-3">
          {variations.map((row, index) => (
            <div key={row.id || index} className="grid gap-2 rounded-xl border border-line p-3 md:grid-cols-6">
              <input placeholder="Size" value={row.size} onChange={(e) => setVariations(update(variations, index, { size: e.target.value }))} className="rounded-lg border border-line px-2 py-2" />
              <input placeholder="Barcode" value={row.barcode} onChange={(e) => setVariations(update(variations, index, { barcode: e.target.value }))} className="rounded-lg border border-line px-2 py-2" />
              <input placeholder="SKU" value={row.sku} onChange={(e) => setVariations(update(variations, index, { sku: e.target.value }))} className="rounded-lg border border-line px-2 py-2" />
              <input placeholder="Price" type="number" min={0} step="0.01" value={row.price} onChange={(e) => setVariations(update(variations, index, { price: e.target.value }))} className="rounded-lg border border-line px-2 py-2" />
              <input placeholder="Sale price" type="number" min={0} step="0.01" value={row.salePrice} onChange={(e) => setVariations(update(variations, index, { salePrice: e.target.value }))} className="rounded-lg border border-line px-2 py-2" />
              <div className="flex gap-2">
                <input placeholder="Stock" type="number" min={0} value={row.stock} onChange={(e) => setVariations(update(variations, index, { stock: e.target.value }))} className="w-full rounded-lg border border-line px-2 py-2" />
                <button type="button" className="text-xs text-muted" onClick={() => setVariations(variations.filter((_, i) => i !== index))}>
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="soft-card p-6">
        <h2 className="font-semibold text-forest">Photographs</h2>
        <p className="mt-1 text-sm text-muted">
          Choose photos anytime — new products upload to MySQL when you save. Or use{" "}
          <a href="/admin/photos-by-bcn" className="text-emerald underline">
            Photos by BCN
          </a>{" "}
          with any size barcode for this product.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          {pendingPhotos.map((file, index) => (
            <div key={`${file.name}-${index}`} className="relative h-24 w-24 overflow-hidden rounded-xl ring-2 ring-emerald/40">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={URL.createObjectURL(file)} alt="" className="h-full w-full object-cover" />
              <span className="absolute bottom-0 left-0 right-0 bg-forest/80 px-1 text-center text-[10px] text-white">
                Queued
              </span>
              <button
                type="button"
                onClick={() => setPendingPhotos((current) => current.filter((_, i) => i !== index))}
                className="absolute right-1 top-1 rounded bg-white/90 px-1 text-xs"
              >
                ×
              </button>
            </div>
          ))}
          {images.map((image) => (
            <div key={image.id} className="relative h-24 w-24 overflow-hidden rounded-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image.url} alt="" className="h-full w-full object-cover" />
              <button type="button" onClick={() => removeImage(image.id)} className="absolute right-1 top-1 rounded bg-white/90 px-1 text-xs">
                ×
              </button>
            </div>
          ))}
        </div>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="mt-4 text-sm"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void uploadPhoto(file);
          }}
        />
      </section>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {message ? <p className="text-sm text-emerald">{message}</p> : null}
      <div className="flex flex-wrap gap-3">
        <button disabled={busy} className="rounded-full bg-forest px-6 py-3 text-white">
          {busy ? "Saving…" : "Save product"}
        </button>
        {productId ? (
          <>
            <button type="button" onClick={() => removeProduct(true)} className="rounded-full border border-line px-6 py-3">
              Archive
            </button>
            <button type="button" onClick={() => removeProduct(false)} className="rounded-full border border-red-200 px-6 py-3 text-red-700">
              Delete
            </button>
          </>
        ) : null}
      </div>
    </form>
  );
}

function update(rows: Variation[], index: number, patch: Partial<Variation>) {
  return rows.map((row, i) => (i === index ? { ...row, ...patch } : row));
}
