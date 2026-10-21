import { STORE } from "@/lib/store";

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="display text-4xl text-forest">About {STORE.name}</h1>
      <p className="mt-4 text-muted">
        {STORE.name} is a footwear store in {STORE.city}, {STORE.state}. Visit us at {STORE.address} or shop the catalog online.
      </p>
    </div>
  );
}
