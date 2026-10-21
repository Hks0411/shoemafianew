"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { cartSubtotal, readCart, writeCart, type CartItem } from "@/lib/cart";
import { formatInr } from "@/lib/money";

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    setItems(readCart());
    fetch("/api/customer/session")
      .then((res) => setSignedIn(res.ok))
      .catch(() => setSignedIn(false));
  }, []);

  function update(next: CartItem[]) {
    writeCart(next);
    setItems(next);
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="display text-4xl text-forest">Cart</h1>
      {!items.length ? (
        <div className="empty-state mt-8">
          Your cart is empty. <Link href="/shop" className="text-emerald">Browse shoes</Link>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {items.map((item) => (
            <div key={item.variationId} className="soft-card flex items-center gap-4 p-4">
              <div className="h-20 w-20 overflow-hidden rounded-xl bg-mint">
                {item.image ? <img src={item.image} alt="" className="h-full w-full object-cover" /> : null}
              </div>
              <div className="flex-1">
                <p className="font-medium">{item.name}</p>
                <p className="text-sm text-muted">Size {item.size}</p>
                <p>{formatInr(item.price)}</p>
              </div>
              <input
                type="number"
                min={1}
                value={item.quantity}
                className="w-20 rounded-xl border border-line px-2 py-1"
                onChange={(e) =>
                  update(items.map((row) => (row.variationId === item.variationId ? { ...row, quantity: Math.max(1, Number(e.target.value)) } : row)))
                }
              />
              <button className="text-sm text-muted" onClick={() => update(items.filter((row) => row.variationId !== item.variationId))}>
                Remove
              </button>
            </div>
          ))}
          <div className="flex items-center justify-between pt-4">
            <p className="text-lg font-semibold">Subtotal {formatInr(cartSubtotal())}</p>
            <Link
              href={signedIn ? "/checkout" : "/account/login?next=/checkout"}
              className="rounded-full bg-forest px-6 py-3 text-white"
            >
              {signedIn ? "Checkout" : "Sign in to checkout"}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
