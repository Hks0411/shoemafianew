import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { databaseConfigHint, describeDatabaseError } from "@/lib/database-issue";

export const dynamic = "force-dynamic";

export async function GET() {
  const configHint = databaseConfigHint();
  if (configHint) {
    return NextResponse.json({ ok: false, error: configHint }, { status: 503 });
  }
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true, database: "connected" });
  } catch (error) {
    return NextResponse.json({ ok: false, error: describeDatabaseError(error) }, { status: 503 });
  }
}
