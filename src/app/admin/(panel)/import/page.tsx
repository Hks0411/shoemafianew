"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

const FIELDS = [
  ["name", "Item name"],
  ["category", "Category (Crocss, Formal, …)"],
  ["itemCode", "Item code"],
  ["groupKey", "Group / model"],
  ["size", "Size"],
  ["barcode", "Barcode"],
  ["sku", "SKU"],
  ["price", "Price"],
  ["salePrice", "Sale price"],
  ["stock", "Stock"],
  ["description", "Description"],
] as const;

type Sample = { rowNumber: number; issues: string[]; name?: string; size?: string };

export default function ImportPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Array<{ id: string; filename: string; status: string; processedRows: number; totalRows: number; errorCount: number }>>([]);
  const [jobId, setJobId] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string | null>>({});
  const [mode, setMode] = useState("UPSERT");
  const [sample, setSample] = useState<Sample[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/admin/import")
      .then((res) => res.json())
      .then((data) => setJobs(data.jobs || []))
      .catch(() => setJobs([]));
  }, []);

  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const file = new FormData(event.currentTarget).get("file");
    if (!(file instanceof File) || !file.size) return;
    setBusy(true);
    setError("");
    const form = new FormData();
    form.set("file", file);
    const res = await fetch("/api/admin/import", { method: "POST", body: form });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Upload failed");
      return;
    }
    setJobId(data.jobId);
    setHeaders(data.headers);
    setMapping(data.mapping);
    setSample(data.sample);
    setTotalRows(data.totalRows);
  }

  async function saveAndStart() {
    setBusy(true);
    setError("");
    const mapped = await fetch(`/api/admin/import/${jobId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mapping, mode }),
    });
    const mappedData = await mapped.json();
    if (!mapped.ok) {
      setBusy(false);
      setError(mappedData.error || "Mapping failed");
      return;
    }
    const started = await fetch(`/api/admin/import/${jobId}/start`, { method: "POST" });
    const startData = await started.json();
    setBusy(false);
    if (!started.ok) {
      setError(startData.error || "Could not start import");
      return;
    }
    router.push(`/admin/import/${jobId}`);
  }

  return (
    <div>
      <h1 className="display text-3xl text-forest">Busy Excel import</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        Upload a Busy export. The file is stored on the server and processed in chunks so a 25,000-row catalog does not load into the browser.
      </p>
      <form onSubmit={upload} className="soft-card mt-6 flex flex-wrap items-end gap-3 p-5">
        <input type="file" name="file" accept=".xlsx,.xls,.csv" required className="text-sm" />
        <button disabled={busy} className="rounded-full bg-forest px-5 py-2 text-white">
          {busy ? "Reading…" : "Upload and preview"}
        </button>
      </form>
      {error ? <p className="mt-4 text-red-700">{error}</p> : null}

      {jobId ? (
        <section className="soft-card mt-6 p-5">
          <p className="text-sm text-muted">{totalRows} rows detected. Map columns, then start the background job.</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {FIELDS.map(([field, label]) => (
              <label key={field} className="text-sm">
                {label}
                <select
                  value={mapping[field] || ""}
                  onChange={(e) => setMapping({ ...mapping, [field]: e.target.value || null })}
                  className="mt-1 w-full rounded-xl border border-line px-3 py-2"
                >
                  <option value="">Not mapped</option>
                  {headers.map((header) => (
                    <option key={header} value={header}>{header}</option>
                  ))}
                </select>
              </label>
            ))}
          </div>
          <label className="mt-4 block text-sm">
            Import behaviour
            <select value={mode} onChange={(e) => setMode(e.target.value)} className="mt-1 w-full max-w-sm rounded-xl border border-line px-3 py-2">
              <option value="UPSERT">Create new and update matching products</option>
              <option value="CREATE_ONLY">Import only new records</option>
              <option value="UPDATE_MATCHING">Update matching products only</option>
            </select>
          </label>
          <div className="mt-4 overflow-x-auto text-sm">
            <table className="w-full text-left">
              <thead>
                <tr className="text-muted">
                  <th className="p-2">Row</th>
                  <th className="p-2">Valid</th>
                  <th className="p-2">Notes</th>
                </tr>
              </thead>
              <tbody>
                {sample.map((row) => (
                  <tr key={row.rowNumber} className="border-t border-line">
                    <td className="p-2">{row.rowNumber}</td>
                    <td className="p-2">{row.issues?.length ? "No" : "Yes"}</td>
                    <td className="p-2">{row.issues?.join("; ") || `${row.name || ""} ${row.size || ""}`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button type="button" disabled={busy} onClick={saveAndStart} className="mt-4 rounded-full bg-forest px-5 py-2 text-white">
            Start background import
          </button>
        </section>
      ) : null}

      <section className="mt-8">
        <h2 className="font-semibold text-forest">Import history</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {jobs.map((job) => (
            <li key={job.id}>
              <Link href={`/admin/import/${job.id}`} className="text-emerald">
                {job.filename} · {job.status} · {job.processedRows}/{job.totalRows} · {job.errorCount} errors
              </Link>
            </li>
          ))}
          {!jobs.length ? <li className="text-muted">No imports yet.</li> : null}
        </ul>
      </section>
    </div>
  );
}
