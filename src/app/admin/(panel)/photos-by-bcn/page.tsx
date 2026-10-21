"use client";

import { FormEvent, useState } from "react";

type UploadResult = {
  product: { id: string; name: string };
  size: string;
  barcode: string;
  image: { id: string; url: string };
};

export default function PhotosByBcnPage() {
  const [barcode, setBarcode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [last, setLast] = useState<UploadResult | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setLast(null);
    const form = event.currentTarget;
    const fileInput = form.elements.namedItem("file") as HTMLInputElement;
    const file = fileInput.files?.[0];
    if (!file) {
      setBusy(false);
      setError("Choose a photo");
      return;
    }
    const body = new FormData();
    body.set("barcode", barcode.trim());
    body.set("file", file);
    const res = await fetch("/api/admin/upload/by-barcode", { method: "POST", body });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Upload failed");
      return;
    }
    setLast(data as UploadResult);
    setBarcode("");
    fileInput.value = "";
  }

  return (
    <div>
      <h1 className="display text-3xl text-forest">Product photos by barcode</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        Scan or type a size barcode (BCN) from Busy, then upload one photo. It attaches to that product for every size
        (same parent). Import products first so the barcode exists in the catalog.
      </p>
      <form onSubmit={onSubmit} className="soft-card mt-6 grid max-w-lg gap-4 p-6">
        <label className="text-sm">
          Barcode (BCN)
          <input
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            placeholder="e.g. 8901234567890"
            className="mt-1 w-full rounded-xl border border-line px-3 py-2 font-mono"
            required
            autoComplete="off"
          />
        </label>
        <label className="text-sm">
          Photo (JPEG, PNG, WEBP, GIF — max 8MB)
          <input type="file" name="file" accept="image/jpeg,image/png,image/webp,image/gif" className="mt-2 block w-full text-sm" required />
        </label>
        <button disabled={busy} className="rounded-full bg-forest px-5 py-2.5 text-white disabled:opacity-60">
          {busy ? "Uploading…" : "Upload to product"}
        </button>
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        {last ? (
          <div className="rounded-xl border border-emerald/30 bg-emerald/5 p-4 text-sm">
            <p className="font-medium text-forest">{last.product.name}</p>
            <p className="text-muted">Size {last.size} · BCN {last.barcode}</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={last.image.url} alt="" className="mt-3 h-32 w-32 rounded-lg object-cover" />
            <p className="mt-2">
              <a href={`/admin/products/${last.product.id}`} className="text-emerald underline">
                Open product
              </a>
            </p>
          </div>
        ) : null}
      </form>
    </div>
  );
}
