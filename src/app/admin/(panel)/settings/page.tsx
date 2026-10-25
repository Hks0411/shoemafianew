"use client";

import { FormEvent, useEffect, useState } from "react";

export default function SettingsPage() {
  const [codCourierCharge, setCodCourierCharge] = useState("200");
  const [prepaidCourierCharge, setPrepaidCourierCharge] = useState("150");
  const [lowStockThreshold, setLowStockThreshold] = useState("3");
  const [paymentsEnabled, setPaymentsEnabled] = useState(false);
  const [integrations, setIntegrations] = useState({ imageStorage: "mysql", razorpay: false });
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/admin/settings").then((res) => res.json()).then((data) => {
      setCodCourierCharge(String(data.codCourierCharge ?? 200));
      setPrepaidCourierCharge(String(data.prepaidCourierCharge ?? 150));
      setLowStockThreshold(String(data.lowStockThreshold ?? 3));
      setPaymentsEnabled(Boolean(data.paymentsEnabled));
    });
    fetch("/api/admin/session").then((res) => res.json()).then((data) => {
      setIntegrations(data.integrations || { imageStorage: "mysql", razorpay: false });
    });
  }, []);

  async function save(event: FormEvent) {
    event.preventDefault();
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        codCourierCharge: Number(codCourierCharge),
        prepaidCourierCharge: Number(prepaidCourierCharge),
        lowStockThreshold: Number(lowStockThreshold),
        paymentsEnabled,
      }),
    });
    setMessage(res.ok ? "Settings saved" : "Could not save");
  }

  return (
    <div>
      <h1 className="display text-3xl text-forest">Store settings</h1>
      <form onSubmit={save} className="soft-card mt-6 grid max-w-xl gap-4 p-6">
        <label className="text-sm">
          COD courier charge (INR)
          <input value={codCourierCharge} onChange={(e) => setCodCourierCharge(e.target.value)} type="number" min={0} className="mt-1 w-full rounded-xl border border-line px-3 py-2" />
        </label>
        <label className="text-sm">
          Prepaid courier charge (INR)
          <input value={prepaidCourierCharge} onChange={(e) => setPrepaidCourierCharge(e.target.value)} type="number" min={0} className="mt-1 w-full rounded-xl border border-line px-3 py-2" />
        </label>
        <label className="text-sm">
          Low-stock threshold
          <input value={lowStockThreshold} onChange={(e) => setLowStockThreshold(e.target.value)} type="number" min={0} className="mt-1 w-full rounded-xl border border-line px-3 py-2" />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={paymentsEnabled} onChange={(e) => setPaymentsEnabled(e.target.checked)} />
          Enable Razorpay checkout once keys are configured
        </label>
        <button className="rounded-full bg-forest px-4 py-2 text-white">Save settings</button>
        {message ? <p className="text-sm text-emerald">{message}</p> : null}
      </form>
      <section className="mt-8 text-sm">
        <h2 className="font-semibold text-forest">Integrations</h2>
        <p className="mt-2">Product images: stored in MySQL ({integrations.imageStorage || "mysql"})</p>
        <p>Razorpay: {integrations.razorpay ? "keys present" : "not activated"}</p>
      </section>
    </div>
  );
}
