import { prisma } from "@/lib/db";
import { applyMappedRow } from "@/lib/import/apply-row";
import { expandSizeColumns, parseMappedRow } from "@/lib/import/group";
import type { ColumnMapping } from "@/lib/import/mapping";
import { iterateSheetRows } from "@/lib/import/stream";
import type { ImportMode } from "@prisma/client";

const CHUNK = 80;

export async function processImportJob(jobId: string) {
  const job = await prisma.importJob.findUnique({ where: { id: jobId } });
  if (!job) return;
  if (!job.mappingJson) {
    await prisma.importJob.update({
      where: { id: jobId },
      data: { status: "FAILED", message: "Column mapping is missing" },
    });
    return;
  }

  const claimed = await prisma.importJob.updateMany({
    where: { id: jobId, status: { in: ["QUEUED", "MAPPED"] } },
    data: { status: "RUNNING", message: "Import running" },
  });
  if (claimed.count !== 1) {
    const current = await prisma.importJob.findUnique({ where: { id: jobId } });
    const stale = current?.status === "RUNNING" && Date.now() - current.updatedAt.getTime() > 5 * 60 * 1000;
    if (!stale) return;
    await prisma.importJob.update({
      where: { id: jobId },
      data: { status: "RUNNING", message: "Import resumed" },
    });
  }

  const mapping = JSON.parse(job.mappingJson) as ColumnMapping;
  const headers = job.headersJson ? (JSON.parse(job.headersJson) as string[]) : [];
  const mode = job.mode as ImportMode;
  let buffer: ReturnType<typeof parseMappedRow>[] = [];
  let processed = job.processedRows;
  let success = job.successCount;
  let skipped = job.skippedCount;
  let errors = job.errorCount;
  let lastRow = job.lastProcessedRow;

  const flush = async () => {
    if (!buffer.length) return;
    const chunk = buffer;
    buffer = [];
    for (const row of chunk) {
      try {
        const result = await prisma.$transaction((tx) => applyMappedRow(tx, row, mode, jobId));
        if (result === "skipped") skipped += 1;
        else success += 1;
      } catch (error) {
        errors += 1;
        await prisma.importError.create({
          data: {
            jobId,
            rowNumber: row.rowNumber,
            rawJson: JSON.stringify(row.raw).slice(0, 8000),
            message: error instanceof Error ? error.message : "Unknown import error",
          },
        });
      }
      processed += 1;
      lastRow = row.rowNumber;
    }

    await prisma.importJob.update({
      where: { id: jobId },
      data: {
        processedRows: processed,
        successCount: success,
        skippedCount: skipped,
        errorCount: errors,
        lastProcessedRow: lastRow,
      },
    });
  };

  await iterateSheetRows(
    job.storagePath,
    async (sheetRow) => {
      const live = await prisma.importJob.findUnique({ where: { id: jobId }, select: { status: true } });
      if (!live || live.status === "CANCELLED" || live.status === "PAUSED") return;
      const sizeCols = !mapping.size ? expandSizeColumns(sheetRow.values, headers) : [];
      const filledSizes = sizeCols.filter((col) => col.stock !== "" && col.stock != null);
      if (filledSizes.length) {
        for (const col of filledSizes) {
          const parsed = parseMappedRow(sheetRow.rowNumber, sheetRow.values, mapping);
          parsed.size = col.size;
          const qty = Number(col.stock);
          if (Number.isFinite(qty)) parsed.stock = Math.trunc(qty);
          buffer.push(parsed);
        }
      } else {
        buffer.push(parseMappedRow(sheetRow.rowNumber, sheetRow.values, mapping));
      }
      if (buffer.length >= CHUNK) await flush();
    },
    { fromRowNumber: job.lastProcessedRow },
  );
  await flush();

  const latest = await prisma.importJob.findUnique({ where: { id: jobId } });
  if (latest?.status === "CANCELLED" || latest?.status === "PAUSED") return;

  await prisma.importJob.update({
    where: { id: jobId },
    data: {
      status: "COMPLETED",
      message: "Import finished",
      processedRows: processed,
      successCount: success,
      skippedCount: skipped,
      errorCount: errors,
      lastProcessedRow: lastRow,
    },
  });
}

export async function retryImportErrors(jobId: string) {
  const job = await prisma.importJob.findUnique({ where: { id: jobId } });
  if (!job?.mappingJson) throw new Error("Import mapping is missing");
  const mapping = JSON.parse(job.mappingJson) as ColumnMapping;
  const mode = job.mode as ImportMode;
  const failed = await prisma.importError.findMany({ where: { jobId }, orderBy: { rowNumber: "asc" } });
  if (!failed.length) return { retried: 0, remaining: 0 };

  await prisma.importJob.update({
    where: { id: jobId },
    data: { status: "RUNNING", message: "Retrying failed rows" },
  });

  let recovered = 0;
  for (const item of failed) {
    let raw: Record<string, unknown>;
    try {
      raw = JSON.parse(item.rawJson) as Record<string, unknown>;
    } catch {
      continue;
    }
    const row = parseMappedRow(item.rowNumber, raw, mapping);
    try {
      await prisma.$transaction((tx) => applyMappedRow(tx, row, mode, jobId));
      await prisma.importError.delete({ where: { id: item.id } });
      recovered += 1;
    } catch (error) {
      await prisma.importError.update({
        where: { id: item.id },
        data: { message: error instanceof Error ? error.message : "Unknown import error" },
      });
    }
  }

  const remaining = await prisma.importError.count({ where: { jobId } });
  await prisma.importJob.update({
    where: { id: jobId },
    data: {
      status: "COMPLETED",
      successCount: { increment: recovered },
      errorCount: remaining,
      message: remaining ? `Retry finished with ${remaining} rows still failing` : "Retry finished",
    },
  });
  return { retried: recovered, remaining };
}

let workerStarted = false;

export function startImportWorker() {
  if (workerStarted) return;
  workerStarted = true;
  const tick = async () => {
    try {
      const job = await prisma.importJob.findFirst({
        where: {
          OR: [
            { status: "QUEUED" },
            { status: "RUNNING", updatedAt: { lt: new Date(Date.now() - 5 * 60 * 1000) } },
          ],
        },
        orderBy: { createdAt: "asc" },
      });
      if (job) await processImportJob(job.id);
    } catch (error) {
      console.error("Import worker error", error);
    } finally {
      setTimeout(tick, 2000);
    }
  };
  void tick();
}
