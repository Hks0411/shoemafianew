"use client";

import Link from "next/link";

export default function StoreError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const message = error.message || "";
  const dbIssue =
    message.includes("Can't reach database") ||
    message.includes("P1001") ||
    message.includes("DATABASE_URL") ||
    message.includes("Invalid") ||
    message.includes("connect");

  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <h1 className="display text-3xl text-forest">Something went wrong</h1>
      {dbIssue ? (
        <p className="mt-4 text-sm text-muted">
          The site cannot reach the MySQL database. On Vercel or Render, set{" "}
          <code className="rounded bg-cream px-1">DATABASE_URL</code> to a{" "}
          <strong>cloud MySQL host</strong> (not <code className="rounded bg-cream px-1">127.0.0.1</code> or{" "}
          <code className="rounded bg-cream px-1">YOUR-MYSQL-HOST</code>), run migrations, then redeploy.
        </p>
      ) : (
        <p className="mt-4 text-sm text-muted">{message || "A server error occurred."}</p>
      )}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={() => reset()} className="rounded-full bg-forest px-5 py-2.5 text-white">
          Try again
        </button>
        <Link href="/" className="rounded-full border border-line px-5 py-2.5">
          Home
        </Link>
      </div>
    </div>
  );
}
