"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/brand/Logo";

export default function AdminSetupPage() {
  const router = useRouter();
  const [name, setName] = useState("Shoe Mafia Admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/admin/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Setup failed");
      return;
    }
    router.replace("/admin");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-forest px-4">
      <form onSubmit={onSubmit} className="w-full max-w-md rounded-3xl bg-white p-8">
        <Logo className="mx-auto h-24 w-24" />
        <h1 className="display mt-6 text-center text-3xl text-forest">Create admin</h1>
        <p className="mt-2 text-center text-sm text-muted">
          Use this only if no admin exists yet. Prefer the username in your environment file.
        </p>
        <label className="mt-6 block text-sm">Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-xl border border-line px-3 py-2" />
        <label className="mt-4 block text-sm">Email</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="mt-1 w-full rounded-xl border border-line px-3 py-2" />
        <label className="mt-4 block text-sm">Password</label>
        <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" className="mt-1 w-full rounded-xl border border-line px-3 py-2" />
        {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}
        <button disabled={busy} className="mt-6 w-full rounded-full bg-forest py-3 text-white">
          {busy ? "Creating…" : "Create admin"}
        </button>
      </form>
    </div>
  );
}
