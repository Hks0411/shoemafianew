import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { adminOr401 } from "@/lib/auth/guard";
import { prisma } from "@/lib/db";
import { readHeadersAndPreview } from "@/lib/import/stream";
import { suggestMapping } from "@/lib/import/mapping";
import { parseMappedRow } from "@/lib/import/group";
import { audit } from "@/lib/audit";

export async function GET() {
  const { admin, response } = await adminOr401();
  if (!admin) return response;
  const jobs = await prisma.importJob.findMany({
    orderBy: { createdAt: "desc" },
    take: 30,
  });
  return NextResponse.json({ jobs });
}

export async function POST(request: Request) {
  const { admin, response } = await adminOr401();
  if (!admin) return response;
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Upload an Excel or CSV file" }, { status: 400 });
  const name = file.name.toLowerCase();
  if (!name.endsWith(".xlsx") && !name.endsWith(".xls") && !name.endsWith(".csv")) {
    return NextResponse.json({ error: "Only .xlsx, .xls, and .csv files are supported" }, { status: 400 });
  }
  if (name.endsWith(".xls") && !name.endsWith(".xlsx")) {
    return NextResponse.json(
      {
        error:
          "Excel 97-2003 (.xls) cannot be streamed safely. In Busy, export again as .xlsx or .csv, then upload that file.",
      },
      { status: 400 },
    );
  }
  if (file.size > 40 * 1024 * 1024) {
    return NextResponse.json({ error: "File is larger than 40MB" }, { status: 400 });
  }

  const job = await prisma.importJob.create({
    data: {
      filename: file.name,
      storagePath: "pending",
    },
  });
  const dir = path.join(process.cwd(), "data", "imports");
  await mkdir(dir, { recursive: true });
  const storagePath = path.join(dir, `${job.id}${path.extname(file.name)}`);
  await writeFile(storagePath, Buffer.from(await file.arrayBuffer()));

  const preview = await readHeadersAndPreview(storagePath);
  const mapping = suggestMapping(preview.headers);
  await prisma.importJob.update({
    where: { id: job.id },
    data: {
      storagePath,
      headersJson: JSON.stringify(preview.headers),
      totalRows: preview.totalRows,
      mappingJson: JSON.stringify(mapping),
      status: "UPLOADED",
    },
  });
  await audit({ adminId: admin.id, action: "upload", entity: "ImportJob", entityId: job.id, detail: { filename: file.name } });

  const sample = preview.preview.map((row) => parseMappedRow(row.rowNumber, row.values, mapping));
  return NextResponse.json({
    jobId: job.id,
    headers: preview.headers,
    mapping,
    totalRows: preview.totalRows,
    preview: preview.preview,
    sample,
  });
}
