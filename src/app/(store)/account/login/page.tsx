"use client";

import Link from "next/link";
import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Logo } from "@/components/brand/Logo";

function LoginForm() {
  const router = useRouter();
  const next = useSearchParams().get("next") || "/account";
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [displayOtp, setDisplayOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function postJson(path: string, body: Record<string, string>) {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 25_000);
    try {
      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; displayOtp?: string };
      return { res, data };
    } catch (err) {
      const aborted = err instanceof DOMException && err.name === "AbortError";
      return {
        res: null,
        data: {
          error: aborted
            ? "Request timed out. The server may be waiting on the database — refresh and try again in a minute."
            : "Network error. Check your connection and try again.",
        },
      };
    } finally {
      window.clearTimeout(timeout);
    }
  }

  async function sendOtp(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { res, data } = await postJson("/api/auth/otp/send", { phone });
      if (!res?.ok) {
        setError(data.error || "Could not send OTP");
        return;
      }
      setDisplayOtp(data.displayOtp || "");
      setOtp(data.displayOtp || "");
      setStep("otp");
    } finally {
      setBusy(false);
    }
  }

  async function verifyOtp(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { res, data } = await postJson("/api/auth/otp/verify", { phone, otp });
      if (!res?.ok) {
        setError(data.error || "Could not verify OTP");
        return;
      }
      router.replace(next);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <Logo className="mx-auto h-20 w-20" />
      <h1 className="display mt-6 text-center text-3xl text-forest">Customer sign in</h1>
      <p className="mt-2 text-center text-sm text-muted">Use your mobile number. OTP appears on screen for verification.</p>

      {step === "phone" ? (
        <form onSubmit={sendOtp} className="soft-card mt-8 space-y-4 p-6">
          <label className="block text-sm">
            Mobile number
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
              placeholder="10-digit mobile"
              pattern="[6-9][0-9]{9}"
              className="mt-1 w-full rounded-xl border border-line px-3 py-2.5"
              required
            />
          </label>
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
          <button disabled={busy} className="w-full rounded-full bg-forest py-3 text-white disabled:opacity-60">
            {busy ? "Sending…" : "Send OTP"}
          </button>
        </form>
      ) : (
        <form onSubmit={verifyOtp} className="soft-card mt-8 space-y-4 p-6">
          {displayOtp ? (
            <div className="rounded-xl border border-emerald/40 bg-mint p-4 text-center">
              <p className="text-xs uppercase tracking-widest text-muted">Your OTP (on screen)</p>
              <p className="display mt-2 text-4xl tracking-[0.35em] text-forest">{displayOtp}</p>
              <p className="mt-2 text-xs text-muted">Valid for 10 minutes. Enter it below if it is not filled automatically.</p>
            </div>
          ) : null}
          <label className="block text-sm">
            OTP
            <input
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              pattern="\d{6}"
              className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-center text-2xl tracking-[0.4em]"
              required
            />
          </label>
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
          <button disabled={busy} className="w-full rounded-full bg-forest py-3 text-white disabled:opacity-60">
            {busy ? "Verifying…" : "Verify & sign in"}
          </button>
          <button type="button" className="w-full text-sm text-muted underline" onClick={() => setStep("phone")}>
            Change mobile number
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-sm">
        <Link href="/shop" className="text-emerald">
          Continue shopping
        </Link>
      </p>
    </div>
  );
}

export default function CustomerLoginPage() {
  return (
    <Suspense fallback={<p className="p-8 text-center text-muted">Loading…</p>}>
      <LoginForm />
    </Suspense>
  );
}
