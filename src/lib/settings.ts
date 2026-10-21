import { prisma } from "@/lib/db";
import { DEFAULT_SETTINGS, type StoreSettings } from "@/lib/store";

export async function getStoreSettings(): Promise<StoreSettings> {
  const row = await prisma.storeSetting.findUnique({ where: { id: "store" } });
  if (!row) return { ...DEFAULT_SETTINGS };
  try {
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(row.data) as Partial<StoreSettings>) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export async function saveStoreSettings(next: StoreSettings) {
  await prisma.storeSetting.upsert({
    where: { id: "store" },
    create: { id: "store", data: JSON.stringify(next) },
    update: { data: JSON.stringify(next) },
  });
}
