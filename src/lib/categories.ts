import type { Prisma, PrismaClient } from "@prisma/client";
import { slugify } from "@/lib/slug";

/** Default storefront categories for Shoe Mafia. */
export const STORE_CATEGORIES = [
  "Crocss",
  "Birkenstock",
  "Formal",
  "Slipper 7a",
  "Slidder 7a",
] as const;

const ALIASES: Record<string, (typeof STORE_CATEGORIES)[number]> = {
  crocs: "Crocss",
  crocss: "Crocss",
  birkenstock: "Birkenstock",
  formal: "Formal",
  "slipper 7a": "Slipper 7a",
  slipper: "Slipper 7a",
  slider: "Slidder 7a",
  "slider 7a": "Slidder 7a",
  slidder: "Slidder 7a",
  "slidder 7a": "Slidder 7a",
};

export function normalizeCategoryInput(raw: string) {
  const key = raw.replace(/\u00a0/g, " ").trim().toLowerCase().replace(/\s+/g, " ");
  if (!key) return "";
  if (ALIASES[key]) return ALIASES[key];
  const exact = STORE_CATEGORIES.find((name) => name.toLowerCase() === key);
  return exact || raw.replace(/\u00a0/g, " ").trim();
}

type Db = PrismaClient | Prisma.TransactionClient;

export async function ensureStoreCategories(db: Db) {
  for (const name of STORE_CATEGORIES) {
    const slug = slugify(name);
    await db.category.upsert({
      where: { slug },
      create: { name, slug },
      update: { name },
    });
  }
}

export async function upsertCategoryByName(db: Db, raw: string) {
  const name = normalizeCategoryInput(raw);
  if (!name) return null;
  const slug = slugify(name);
  const row = await db.category.upsert({
    where: { slug },
    create: { name, slug },
    update: { name },
  });
  return row.id;
}
