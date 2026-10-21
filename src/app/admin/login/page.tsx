"use client";

import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Logo } from "@/components/brand/Logo";

function LoginForm() {
  const router = useRouter();
  const next = useSearchParams().get("next") || "/admin";
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Could not sign in");
      return;
    }
    router.replace(next);
  }

  return (
    <form onSubmit={onSubmit} className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
      <Logo className="mx-auto h-24 w-24" />
      <h1 className="display mt-6 text-center text-3xl text-forest">Admin portal</h1>
      <p className="mt-2 text-center text-sm text-muted">Sign in to manage SHOE MAFIA</p>
      <label className="mt-8 block text-sm font-medium">Username</label>
      <input
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        autoComplete="username"
        className="mt-1 w-full rounded-xl border border-line px-3 py-2.5"
        required
      />
      <label className="mt-4 block text-sm font-medium">Password</label>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="current-password"
        className="mt-1 w-full rounded-xl border border-line px-3 py-2.5"
        required
      />
      {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}
      <button disabled={busy} className="mt-6 w-full rounded-full bg-forest py-3 font-medium text-white disabled:opacity-60">
        {busy ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-forest-deep px-4">
      <Suspense fallback={<p className="text-white">Loading…</p>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
