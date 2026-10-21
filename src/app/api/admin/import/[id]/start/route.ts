import { NextResponse } from "next/server";
import { adminOr401 } from "@/lib/auth/guard";
import { prisma } from "@/lib/db";
import { processImportJob } from "@/lib/import/process";
import { audit } from "@/lib/audit";

export async function POST(_: Request, context: { params: Promise<{ id: string }> }) {
  const { admin, response } = await adminOr401();
  if (!admin) return response;
  const { id } = await context.params;
  const job = await prisma.importJob.findUnique({ where: { id } });
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!job.mappingJson) return NextResponse.json({ error: "Save column mapping first" }, { status: 400 });

  await prisma.importJob.update({
    where: { id },
    data: { status: "QUEUED", message: "Queued" },
  });
  await audit({ adminId: admin.id, action: "start", entity: "ImportJob", entityId: id });
  void processImportJob(id);
  return NextResponse.json({ ok: true });
}
