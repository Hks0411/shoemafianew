import { readFile } from "fs/promises";
import path from "path";

export const runtime = "nodejs";

export async function GET() {
  const candidates = [
    path.join(process.cwd(), "public", "brand", "logo.png"),
    path.join(process.cwd(), "public", "logo.png"),
  ];
  for (const filePath of candidates) {
    try {
      const file = await readFile(filePath);
      return new Response(file, {
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "public, max-age=3600",
        },
      });
    } catch {
      // try next path
    }
  }
  return new Response("Logo file missing. Add public/brand/logo.png", { status: 404 });
}
