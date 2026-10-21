import type { Metadata } from "next";
import { Outfit, Playfair_Display } from "next/font/google";
import { STORE } from "@/lib/store";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit", display: "swap" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair", display: "swap" });

export const metadata: Metadata = {
  title: {
    default: `${STORE.name} — Footwear, Bilaspur`,
    template: `%s | ${STORE.name}`,
  },
  description: `Shop footwear at ${STORE.name}, ${STORE.address}. Call ${STORE.phone}.`,
  icons: {
    icon: [{ url: "/brand/logo.png", type: "image/png" }],
    apple: "/brand/logo.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${outfit.variable} ${playfair.variable} antialiased`}>{children}</body>
    </html>
  );
}
