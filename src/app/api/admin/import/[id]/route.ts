import { NextResponse } from "next/server";
import { adminOr401 } from "@/lib/auth/guard";
import { prisma } from "@/lib/db";
import { IMPORT_FIELDS, type ColumnMapping } from "@/lib/import/mapping";
import { parseMappedRow } from "@/lib/import/group";
import { readHeadersAndPreview } from "@/lib/import/stream";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { admin, response } = await adminOr401();
  if (!admin) return response;
  const { id } = await context.params;
  const job = await prisma.importJob.findUnique({
    where: { id },
    include: { errors: { orderBy: { rowNumber: "asc" }, take: 50 } },
  });
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(job);
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const { admin, response } = await adminOr401();
  if (!admin) return response;
  const { id } = await context.params;
  const body = (await request.json()) as { mapping?: ColumnMapping; mode?: "CREATE_ONLY" | "UPDATE_MATCHING" | "UPSERT" };
  const job = await prisma.importJob.findUnique({ where: { id } });
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const mapping: ColumnMapping = {};
  for (const field of IMPORT_FIELDS) mapping[field] = body.mapping?.[field] ?? null;
  if (!mapping.name && !mapping.itemCode && !mapping.barcode) {
    return NextResponse.json({ error: "Map at least a name, item code, or barcode column." }, { status: 400 });
  }

  const preview = await readHeadersAndPreview(job.storagePath, 15);
  const sample = preview.preview.map((row) => parseMappedRow(row.rowNumber, row.values, mapping));

  await prisma.importJob.update({
    where: { id },
    data: {
      mappingJson: JSON.stringify(mapping),
      mode: body.mode ?? job.mode,
      status: "MAPPED",
      totalRows: preview.totalRows,
    },
  });
  return NextResponse.json({ ok: true, sample, mapping, totalRows: preview.totalRows });
}
