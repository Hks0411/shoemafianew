"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { addToCart } from "@/lib/cart";
import { effectivePrice, formatInr } from "@/lib/money";
import { optimizedImageUrl } from "@/lib/images";

type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  images: Array<{ url: string; alt?: string | null }>;
  variations: Array<{
    id: string;
    size: string;
    price: number;
    salePrice: number | null;
    available: number;
    barcode: string | null;
  }>;
};

export function ProductDetail({ product }: { product: Product }) {
  const router = useRouter();
  const available = product.variations.filter((v) => v.available > 0);
  const [sizeId, setSizeId] = useState("");
  const [qty, setQty] = useState(1);
  const [message, setMessage] = useState("");
  const [imageIndex, setImageIndex] = useState(0);
  const selected = product.variations.find((v) => v.id === sizeId);
  const price = selected ? effectivePrice(selected.price, selected.salePrice) : 0;
  const image = optimizedImageUrl(product.images[imageIndex]?.url || product.images[0]?.url, 1200);
  const maxQty = selected?.available ?? 0;

  const sizeHelp = useMemo(() => {
    if (!available.length) return "This style is currently sold out.";
    return "Select an available size before adding to cart.";
  }, [available.length]);

  function add(buyNow = false) {
    if (!selected) {
      setMessage(sizeHelp);
      return;
    }
    addToCart({
      variationId: selected.id,
      productId: product.id,
      name: product.name,
      size: selected.size,
      price,
      image,
      quantity: Math.min(qty, maxQty),
    });
    setMessage("Added to cart");
    if (buyNow) {
      void fetch("/api/customer/session").then((res) => {
        router.push(res.ok ? "/checkout" : "/account/login?next=/checkout");
      });
    }
  }

  return (
    <div className="grid gap-10 md:grid-cols-2">
      <div className="overflow-hidden rounded-3xl bg-mint">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt={product.name} width={1200} height={1500} className="aspect-[4/5] w-full object-cover" />
        ) : (
          <div className="flex min-h-[360px] items-center justify-center text-muted">No photograph yet</div>
        )}
        {product.images.length > 1 ? (
          <div className="grid grid-cols-4 gap-2 p-3">
            {product.images.map((img, index) => (
              <button key={img.url} type="button" onClick={() => setImageIndex(index)}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={optimizedImageUrl(img.url, 240)}
                  alt=""
                  width={240}
                  height={180}
                  className={`h-20 w-full rounded-xl object-cover ${index === imageIndex ? "ring-2 ring-forest" : ""}`}
                />
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <div>
        <h1 className="display text-4xl text-forest">{product.name}</h1>
        <p className="mt-3 text-2xl font-semibold">{selected ? formatInr(price) : "Select a size"}</p>
        {selected?.salePrice ? (
          <p className="text-sm text-muted line-through">{formatInr(selected.price)}</p>
        ) : null}
        <p className="mt-5 whitespace-pre-wrap text-muted">{product.description || "Details will appear here."}</p>
        <p className="mt-6 text-sm text-muted">{sizeHelp}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {product.variations.map((variation) => (
            <button
              key={variation.id}
              disabled={variation.available <= 0}
              onClick={() => {
                setSizeId(variation.id);
                setQty(1);
              }}
              className={`rounded-full px-4 py-2 text-sm ${
                variation.id === sizeId
                  ? "bg-forest text-white"
                  : variation.available <= 0
                    ? "cursor-not-allowed border border-line text-muted"
                    : "border border-line"
              }`}
            >
              {variation.size}
              {variation.available <= 0 ? " · out" : ` · ${variation.available} left`}
            </button>
          ))}
        </div>
        <div className="mt-6 flex items-center gap-3">
          <input
            type="number"
            min={1}
            max={maxQty || 1}
            value={qty}
            onChange={(e) => setQty(Math.max(1, Math.min(maxQty || 1, Number(e.target.value))))}
            className="w-24 rounded-xl border border-line px-3 py-2"
          />
          <button onClick={() => add(false)} className="rounded-full bg-forest px-6 py-3 text-white" disabled={!selected}>
            Add to cart
          </button>
          <button onClick={() => add(true)} className="rounded-full border border-forest px-6 py-3 text-forest" disabled={!selected}>
            Buy now
          </button>
        </div>
        {message ? <p className="mt-4 text-sm text-emerald">{message}</p> : null}
      </div>
    </div>
  );
}
