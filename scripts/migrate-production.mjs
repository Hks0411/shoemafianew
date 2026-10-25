/**
 * Run once from your PC after creating cloud MySQL and setting DATABASE_URL:
 *   set DATABASE_URL=mysql://user:pass@host:3306/shoe_mafia
 *   node scripts/migrate-production.mjs
 */
import { execSync } from "node:child_process";

const url = process.env.DATABASE_URL?.trim() || "";
if (!url || url.includes("YOUR-MYSQL-HOST") || url.includes("127.0.0.1")) {
  console.error(
    "Set DATABASE_URL to your cloud MySQL URL first (not localhost or YOUR-MYSQL-HOST).",
  );
  process.exit(1);
}

execSync("npx prisma migrate deploy", { stdio: "inherit", env: process.env });
