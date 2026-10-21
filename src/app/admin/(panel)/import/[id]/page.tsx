"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type Job = {
  id: string;
  filename: string;
  status: string;
  mode: string;
  totalRows: number;
  processedRows: number;
  successCount: number;
  skippedCount: number;
  errorCount: number;
  message: string | null;
  errors: Array<{ id: string; rowNumber: number; message: string }>;
};

export default function ImportJobPage() {
  const { id } = useParams<{ id: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [retryMessage, setRetryMessage] = useState("");

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    async function load() {
      const res = await fetch(`/api/admin/import/${id}`);
      if (res.ok) setJob(await res.json());
    }
    load();
    timer = setInterval(load, 2000);
    return () => clearInterval(timer);
  }, [id]);

  if (!job) return <p className="text-muted">Loading import job…</p>;
  const remaining = Math.max(0, job.totalRows - job.processedRows);

  return (
    <div>
      <h1 className="display text-3xl text-forest">{job.filename}</h1>
      <p className="mt-2 text-sm text-muted">{job.status} · {job.mode}</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          ["Processed", job.processedRows],
          ["Successful", job.successCount],
          ["Skipped", job.skippedCount],
          ["Errors", job.errorCount],
          ["Remaining", remaining],
        ].map(([label, value]) => (
          <div key={String(label)} className="soft-card p-4">
            <p className="text-sm text-muted">{label}</p>
            <p className="text-2xl font-semibold text-forest">{value}</p>
          </div>
        ))}
      </div>
      {job.message ? <p className="mt-4 text-sm">{job.message}</p> : null}
      {retryMessage ? <p className="mt-2 text-sm text-emerald">{retryMessage}</p> : null}
      <div className="mt-6 flex flex-wrap gap-3">
        <a href={`/api/admin/import/${id}/errors`} className="inline-block rounded-full border border-line px-4 py-2 text-sm">
          Download error report
        </a>
        {job.errorCount > 0 ? (
          <button
            type="button"
            disabled={retrying}
            onClick={async () => {
              setRetrying(true);
              setRetryMessage("");
              const res = await fetch(`/api/admin/import/${id}/retry`, { method: "POST" });
              const data = await res.json();
              setRetrying(false);
              setRetryMessage(res.ok ? `Retried ${data.retried} rows. ${data.remaining} still failing.` : data.error || "Retry failed");
            }}
            className="rounded-full bg-forest px-4 py-2 text-sm text-white disabled:opacity-60"
          >
            {retrying ? "Retrying…" : "Retry failed rows"}
          </button>
        ) : null}
      </div>
      <ul className="mt-6 space-y-2 text-sm">
        {job.errors?.map((row) => (
          <li key={row.id} className="rounded-xl border border-line bg-white p-3">
            Row {row.rowNumber}: {row.message}
          </li>
        ))}
      </ul>
    </div>
  );
}
