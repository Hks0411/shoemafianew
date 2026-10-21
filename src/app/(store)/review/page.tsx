"use client";

import { FormEvent, Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

function ReviewForm() {
  const token = useSearchParams().get("token") || "";
  const [authorName, setAuthorName] = useState("");
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const [message, setMessage] = useState("");

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, authorName, rating, body }),
    });
    const data = await res.json();
    setMessage(res.ok ? "Thank you. Your review will appear after approval." : data.error || "Could not submit");
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 grid gap-3">
      <input value={authorName} onChange={(e) => setAuthorName(e.target.value)} placeholder="Your name" required className="rounded-xl border border-line px-3 py-2" />
      <select value={rating} onChange={(e) => setRating(Number(e.target.value))} className="rounded-xl border border-line px-3 py-2">
        {[5, 4, 3, 2, 1].map((n) => (
          <option key={n} value={n}>{n} stars</option>
        ))}
      </select>
      <textarea value={body} onChange={(e) => setBody(e.target.value)} minLength={8} required rows={5} className="rounded-xl border border-line px-3 py-2" />
      <button className="rounded-full bg-forest py-3 text-white">Submit review</button>
      {message ? <p className="text-sm text-emerald">{message}</p> : null}
    </form>
  );
}

export default function ReviewPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <h1 className="display text-4xl text-forest">Write a review</h1>
      <p className="mt-2 text-sm text-muted">Use the link from a delivered order. Reviews are moderated and are not imported from Google.</p>
      <Suspense>
        <ReviewForm />
      </Suspense>
    </div>
  );
}
