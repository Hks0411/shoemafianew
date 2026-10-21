"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { cartCount } from "@/lib/cart";
import { STORE } from "@/lib/store";

export function Header() {
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => {
    const sync = () => setCount(cartCount());
    sync();
    window.addEventListener("cart-changed", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("cart-changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <Link href="/" className="inline-flex shrink-0 items-center">
          <Logo className="h-12 w-12 md:h-14 md:w-14" />
        </Link>
        <form action="/shop" className="hidden flex-1 md:block">
          <input
            name="q"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search shoes, barcode, or item code"
            className="w-full rounded-full border border-line bg-cream px-4 py-2.5 text-sm outline-none focus:border-emerald"
          />
        </form>
        <nav className="ml-auto hidden items-center gap-6 text-sm font-medium text-forest md:flex">
          <Link href="/shop">Shop</Link>
          <Link href="/account">My account</Link>
          <Link href="/about">About</Link>
          <Link href="/contact">Contact</Link>
          <Link href="/track">Track order</Link>
          <Link href="/cart" className="rounded-full bg-forest px-4 py-2 text-white">
            Cart {count ? `(${count})` : ""}
          </Link>
        </nav>
        <button className="ml-auto md:hidden" onClick={() => setOpen((v) => !v)} aria-label="Menu">
          Menu
        </button>
      </div>
      {open ? (
        <div className="space-y-3 border-t border-line px-4 py-4 md:hidden">
          <form action="/shop">
            <input name="q" placeholder="Search" className="w-full rounded-full border border-line px-4 py-2" />
          </form>
          <Link href="/shop" className="block">Shop</Link>
          <Link href="/account" className="block">My account</Link>
          <Link href="/about" className="block">About</Link>
          <Link href="/contact" className="block">Contact</Link>
          <Link href="/track" className="block">Track order</Link>
          <Link href="/cart" className="block font-semibold text-forest">Cart ({count})</Link>
          <a href={`tel:${STORE.phoneTel}`} className="block text-muted">{STORE.phone}</a>
        </div>
      ) : null}
    </header>
  );
}
