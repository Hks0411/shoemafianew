"use client";

import { STORE } from "@/lib/store";
import bundledLogo from "@/assets/shoe-mafia-logo.png";

const FALLBACK_SOURCES = [bundledLogo.src, "/brand/logo.png", "/logo.png", "/api/brand/logo"] as const;

export function Logo({ className = "h-12 w-12" }: { className?: string; light?: boolean }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={bundledLogo.src}
      alt={STORE.name}
      width={bundledLogo.width}
      height={bundledLogo.height}
      decoding="async"
      className={`inline-block shrink-0 object-contain ${className}`}
      onError={(event) => {
        const img = event.currentTarget;
        const current = img.getAttribute("src") || "";
        const index = FALLBACK_SOURCES.findIndex((src) => current.endsWith(src) || current === src);
        const next = FALLBACK_SOURCES[index + 1];
        if (next) img.src = next;
      }}
    />
  );
}
