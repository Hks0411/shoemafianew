import { NextResponse } from "next/server";
import { adminOr401 } from "@/lib/auth/guard";
import { getStoreSettings, saveStoreSettings } from "@/lib/settings";
import { DEFAULT_SETTINGS } from "@/lib/store";
import { audit } from "@/lib/audit";

export async function GET() {
  const { admin, response } = await adminOr401();
  if (!admin) return response;
  return NextResponse.json(await getStoreSettings());
}

export async function PUT(request: Request) {
  const { admin, response } = await adminOr401();
  if (!admin) return response;
  const body = await request.json();
  const next = {
    ...DEFAULT_SETTINGS,
    ...(await getStoreSettings()),
    codCourierCharge: Number(body.codCourierCharge ?? DEFAULT_SETTINGS.codCourierCharge),
    prepaidCourierCharge: Number(body.prepaidCourierCharge ?? DEFAULT_SETTINGS.prepaidCourierCharge),
    lowStockThreshold: Number(body.lowStockThreshold ?? 3),
    paymentsEnabled: Boolean(body.paymentsEnabled),
  };
  await saveStoreSettings(next);
  await audit({ adminId: admin.id, action: "update", entity: "StoreSetting", entityId: "store" });
  return NextResponse.json(next);
}
