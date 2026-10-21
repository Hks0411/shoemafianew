import { NextResponse } from "next/server";
import { adminOr401 } from "@/lib/auth/guard";
import { retryImportErrors } from "@/lib/import/process";
import { audit } from "@/lib/audit";

export async function POST(_: Request, context: { params: Promise<{ id: string }> }) {
  const { admin, response } = await adminOr401();
  if (!admin) return response;
  const { id } = await context.params;
  try {
    const result = await retryImportErrors(id);
    await audit({ adminId: admin.id, action: "retry", entity: "ImportJob", entityId: id, detail: result });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not retry failed rows" },
      { status: 400 },
    );
  }
}
