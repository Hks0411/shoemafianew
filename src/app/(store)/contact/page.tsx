import { STORE } from "@/lib/store";

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="display text-4xl text-forest">Visit the store</h1>
      <p className="mt-4">{STORE.address}</p>
      <p className="mt-2">
        Phone: <a className="text-emerald" href={`tel:${STORE.phoneTel}`}>{STORE.phone}</a>
      </p>
      <iframe
        title="SHOE MAFIA map"
        className="mt-8 h-80 w-full rounded-3xl border-0"
        src="https://maps.google.com/maps?q=Bus%20Stand%20Old%20Telephone%20Exchange%20Road%20Bilaspur%20Telipara%20495001&output=embed"
      />
    </div>
  );
}
