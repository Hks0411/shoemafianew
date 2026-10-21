export const IMPORT_FIELDS = [
  "name",
  "description",
  "category",
  "itemCode",
  "groupKey",
  "size",
  "barcode",
  "sku",
  "price",
  "salePrice",
  "stock",
] as const;

export type ImportField = (typeof IMPORT_FIELDS)[number];
export type ColumnMapping = Partial<Record<ImportField, string | null>>;

const SUGGESTIONS: Record<ImportField, string[]> = {
  name: ["item name", "itemname", "product name", "name", "alias", "particulars"],
  description: ["description", "desc", "narration", "details"],
  category: ["category", "item group", "product group", "group name", "busy group", "main group", "department"],
  itemCode: ["item code", "itemcode", "item no", "style code", "parent code", "code"],
  groupKey: ["group", "group key", "parent", "model", "article", "design code"],
  size: ["size", "sz", "uk size", "eu size", "shoe size"],
  barcode: ["barcode", "bar code", "ean", "upc", "ean code"],
  sku: ["sku", "item sku", "variant sku"],
  price: ["selling price", "sale rate", "price", "sp", "rate", "mrp"],
  salePrice: ["sale price", "offer price", "discounted price"],
  stock: ["stock", "qty", "quantity", "closing stock", "balance", "available"],
};

export function normalizeHeader(header: string) {
  return header.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim().toLowerCase();
}

export function suggestMapping(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {};
  const used = new Set<string>();
  for (const field of IMPORT_FIELDS) {
    const match = headers.find((header) => {
      const n = normalizeHeader(header);
      return SUGGESTIONS[field].some((hint) => n === hint || n.includes(hint)) && !used.has(header);
    });
    if (match) {
      mapping[field] = match;
      used.add(match);
    } else {
      mapping[field] = null;
    }
  }
  return mapping;
}

export function asBarcode(value: unknown) {
  if (value == null) return "";
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return "";
    return value.toLocaleString("fullwide", { useGrouping: false, maximumFractionDigits: 0 });
  }
  const text = String(value).trim();
  if (/^\d+\.?\d*e\+\d+$/i.test(text)) {
    const n = Number(text);
    if (Number.isFinite(n)) {
      return n.toLocaleString("fullwide", { useGrouping: false, maximumFractionDigits: 0 });
    }
  }
  return text;
}

export function asText(value: unknown) {
  if (value == null) return "";
  return String(value).replace(/\u00a0/g, " ").trim();
}

export function asNumber(value: unknown) {
  if (value == null || value === "") return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const cleaned = String(value).replace(/,/g, "").replace(/[^\d.-]/g, "");
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}
