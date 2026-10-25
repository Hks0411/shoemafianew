/**
 * Render (and similar hosts) sometimes inject NODE_ENV=development during build,
 * which breaks Next.js static generation (useContext null). Always build as production.
 */
import { execSync } from "node:child_process";

process.env.NODE_ENV = "production";
execSync("next build", { stdio: "inherit", env: process.env });
