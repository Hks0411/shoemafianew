import { NextResponse } from "next/server";
import { adminOr401 } from "@/lib/auth/guard";
import { prisma } from "@/lib/db";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { admin, response } = await adminOr401();
  if (!admin) return response;
  const { id } = await context.params;
  const errors = await prisma.importError.findMany({
    where: { jobId: id },
    orderBy: { rowNumber: "asc" },
  });
  const header = "rowNumber,message,rawJson\n";
  const body = errors
    .map((row) => `${row.rowNumber},"${row.message.replace(/"/g, '""')}","${row.rawJson.replace(/"/g, '""')}"`)
    .join("\n");
  return new NextResponse(header + body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="import-${id}-errors.csv"`,
    },
  });
}
