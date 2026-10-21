"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "@/components/brand/Logo";

const LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/products/new", label: "Add product" },
  { href: "/admin/photos-by-bcn", label: "Photos by BCN" },
  { href: "/admin/inventory", label: "Inventory" },
  { href: "/admin/import", label: "Busy import" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/banners", label: "Banners" },
  { href: "/admin/reviews", label: "Reviews" },
  { href: "/admin/testimonials", label: "Testimonials" },
  { href: "/admin/settings", label: "Settings" },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("Admin");
  const isPrint = path.includes("/print");

  useEffect(() => {
    if (isPrint) return;
    fetch("/api/admin/session")
      .then((res) => res.json())
      .then((data) => {
        if (!data.authenticated) router.replace("/admin/login");
        else setName(data.admin?.username || data.admin?.name || "Admin");
      })
      .catch(() => router.replace("/admin/login"));
  }, [router, isPrint]);

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
  }

  if (isPrint) return <>{children}</>;

  return (
    <div className="min-h-screen md:grid md:grid-cols-[240px_1fr]">
      <aside className={`bg-forest-deep text-white ${open ? "block" : "hidden"} md:block`}>
        <div className="border-b border-white/10 p-5">
          <Link href="/admin" className="inline-flex rounded-full bg-white/10 p-1 ring-1 ring-white/20">
            <Logo className="h-14 w-14" />
          </Link>
          <p className="mt-3 text-xs uppercase tracking-[0.2em] text-emerald-bright">Admin portal</p>
        </div>
        <nav className="grid gap-1 p-3 text-sm">
          {LINKS.map((link) => {
            const active = path === link.href || (link.href !== "/admin" && path.startsWith(link.href) && link.href !== "/admin/products");
            const productActive = link.href === "/admin/products" && path.startsWith("/admin/products") && path !== "/admin/products/new";
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={`rounded-xl px-3 py-2 ${active || productActive ? "bg-white/15" : "hover:bg-white/10"}`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div>
        <header className="flex items-center justify-between border-b border-line bg-white px-4 py-3">
          <button className="md:hidden" onClick={() => setOpen((v) => !v)}>
            Menu
          </button>
          <p className="text-sm text-muted">Signed in as {name}</p>
          <button onClick={logout} className="rounded-full border border-line px-4 py-1.5 text-sm">
            Sign out
          </button>
        </header>
        <div className="p-4 md:p-8">{children}</div>
      </div>
    </div>
  );
}
