export function databaseConfigHint(): string | null {
  const url = process.env.DATABASE_URL?.trim() || "";
  if (!url) return "DATABASE_URL is not set in the server environment (Vercel → Settings → Environment Variables).";
  if (url.includes("YOUR-MYSQL-HOST")) {
    return "DATABASE_URL still contains the placeholder YOUR-MYSQL-HOST. Replace it with your real cloud MySQL hostname.";
  }
  if (/127\.0\.0\.1|localhost/i.test(url)) {
    return "DATABASE_URL points to localhost. Vercel and Render cannot use the MySQL on your PC — use a cloud MySQL host.";
  }
  return null;
}

export function isPrismaConnectionError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("P1001") ||
    message.includes("Can't reach database") ||
    message.includes("Connection refused") ||
    message.includes("ECONNREFUSED") ||
    message.includes("ENOTFOUND") ||
    message.includes("Access denied")
  );
}

export function isTooManyConnectionsError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes("Too many connections") || message.includes("1040");
}

export function describeDatabaseError(error: unknown): string {
  const config = databaseConfigHint();
  if (config) return config;
  if (isTooManyConnectionsError(error)) {
    return (
      "MySQL rejected new connections (too many open at once). Use connection_limit=2 on Vercel, " +
      "wait a minute, and redeploy."
    );
  }
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("connection pool") || message.includes("pool timeout")) {
    return (
      "Database connection pool timed out. For Aiven on Vercel use sslaccept=accept_invalid_certs " +
      "(the app sets this automatically), correct host/port, and DATABASE_URL pointing to defaultdb or shoe_mafia."
    );
  }
  if (isPrismaConnectionError(error)) {
    return "The server cannot connect to MySQL. Check DATABASE_URL (host, port, user, password), allow remote access on your database, and run migrations.";
  }
  return error instanceof Error ? error.message : "Database error";
}
