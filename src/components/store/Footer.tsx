import Link from "next/link";
import { STORE } from "@/lib/store";
import { Logo } from "@/components/brand/Logo";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-line bg-forest-deep text-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-3">
        <div>
          <Logo className="h-16 w-16" />
          <p className="mt-4 max-w-sm text-sm text-white/75">{STORE.address}</p>
          <p className="mt-2 text-sm">{STORE.phone}</p>
        </div>
        <div className="text-sm">
          <p className="mb-3 font-semibold">Shop</p>
          <div className="grid gap-2 text-white/80">
            <Link href="/shop">All shoes</Link>
            <Link href="/track">Track order</Link>
            <Link href="/contact">Visit the store</Link>
          </div>
        </div>
        <div className="text-sm">
          <p className="mb-3 font-semibold">Policies</p>
          <div className="grid gap-2 text-white/80">
            <Link href="/shipping">Shipping</Link>
            <Link href="/returns">Returns</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
