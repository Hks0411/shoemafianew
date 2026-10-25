import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/** Prisma MySQL URL tuning (Aiven SSL, Vercel serverless pool). */
export function resolveDatabaseUrl(): string | undefined {
  const raw = process.env.DATABASE_URL?.trim();
  if (!raw) return undefined;

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return raw;
  }

  const host = url.hostname.toLowerCase();
  const aiven = host.includes("aivencloud.com");
  const serverless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

  // Aiven requires TLS; on Vercel we use accept_invalid_certs unless a CA path is provided.
  if (aiven || url.searchParams.get("ssl-mode")?.toUpperCase() === "REQUIRED") {
    url.searchParams.delete("ssl-mode");
    if (!url.searchParams.has("sslaccept")) {
      url.searchParams.set(
        "sslaccept",
        process.env.DATABASE_SSL_CA ? "strict" : "accept_invalid_certs",
      );
    }
  }

  if (serverless) {
    if (!url.searchParams.has("connection_limit")) {
      url.searchParams.set("connection_limit", "2");
    }
    if (!url.searchParams.has("pool_timeout")) {
      url.searchParams.set("pool_timeout", "60");
    }
    if (!url.searchParams.has("connect_timeout")) {
      url.searchParams.set("connect_timeout", "15");
    }
  }

  return url.toString();
}

const datasourceUrl = resolveDatabaseUrl();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    ...(datasourceUrl ? { datasources: { db: { url: datasourceUrl } } } : {}),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

globalForPrisma.prisma = prisma;
