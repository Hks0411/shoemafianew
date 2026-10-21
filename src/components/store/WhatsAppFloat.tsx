import { STORE } from "@/lib/store";

export function WhatsAppFloat() {
  return (
    <a
      href={`https://wa.me/${STORE.whatsapp}`}
      className="fixed bottom-5 right-5 z-40 rounded-full bg-[#1f7a54] px-4 py-3 text-sm font-medium text-white shadow-lg"
      aria-label="Chat on WhatsApp"
    >
      WhatsApp
    </a>
  );
}
