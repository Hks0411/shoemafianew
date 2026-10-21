import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [],
  },
  turbopack: {
    root: projectRoot,
  },
  serverExternalPackages: ["exceljs", "@prisma/client", "prisma"],
};

export default nextConfig;
