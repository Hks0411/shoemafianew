import { asBarcode, asNumber, asText, type ColumnMapping } from "@/lib/import/mapping";

export type ParsedRow = {
  rowNumber: number;
  name: string;
  description: string;
  category: string;
  itemCode: string;
  groupKey: string;
  size: string;
  barcode: string;
  sku: string;
  price: number | null;
  salePrice: number | null;
  stock: number | null;
  raw: Record<string, unknown>;
  issues: string[];
};

const SIZE_SUFFIX = /(?:[\s_\-\/]|size\s*)((?:uk|eu|us)?\s*\d{1,2}(?:\.\d)?)$/i;

export function stripSizeSuffix(code: string, size: string) {
  if (!code) return "";
  const trimmed = code.trim();
  if (size) {
    const escaped = size.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const specific = new RegExp(`(?:[\\s_\\-\\/]+|(?<=[A-Za-z]))${escaped}$`, "i");
    const without = trimmed.replace(specific, "");
    if (without && without !== trimmed) return without;
  }
  const generic = trimmed.replace(SIZE_SUFFIX, "");
  return generic || trimmed;
}

/** When the size column is empty, infer size from a trailing number on name or item code. */
export function inferTrailingSize(name: string, itemCode: string) {
  for (const source of [name, itemCode]) {
    if (!source) continue;
    const trimmed = source.trim();
    const match = trimmed.match(/(?:[\s_\-\/]+|(?<=[A-Za-z]))(\d{1,2}(?:\.\d)?)$/);
    if (!match) continue;
    const size = match[1];
    const base = stripSizeSuffix(trimmed, size);
    if (base && base !== trimmed) return { size, baseName: base };
  }
  return null;
}

export function stableParentCode(row: Pick<ParsedRow, "groupKey" | "itemCode" | "name">, size: string) {
  if (row.groupKey.trim()) return row.groupKey.trim();
  if (row.itemCode) {
    const stripped = stripSizeSuffix(row.itemCode, size);
    if (stripped && stripped !== row.itemCode) return stripped;
    return row.itemCode;
  }
  if (row.name) {
    const stripped = stripSizeSuffix(row.name, size);
    if (stripped && stripped !== row.name) return stripped;
  }
  return "";
}

export function displayProductName(row: Pick<ParsedRow, "name" | "itemCode">, size: string) {
  if (row.name) {
    const stripped = stripSizeSuffix(row.name, size);
    if (stripped && stripped !== row.name) return stripped;
    return row.name;
  }
  if (row.itemCode) return stripSizeSuffix(row.itemCode, size) || row.itemCode;
  return "";
}

export function parseMappedRow(
  rowNumber: number,
  record: Record<string, unknown>,
  mapping: ColumnMapping,
): ParsedRow {
  const pick = (field: keyof ColumnMapping) => {
    const header = mapping[field];
    if (!header) return "";
    return record[header];
  };

  let name = asText(pick("name"));
  const itemCode = asBarcode(pick("itemCode"));
  const groupKey = asText(pick("groupKey"));
  let size = asText(pick("size"));
  const category = asText(pick("category"));
  const barcode = asBarcode(pick("barcode"));
  const sku = asBarcode(pick("sku"));
  const price = asNumber(pick("price"));
  const salePrice = asNumber(pick("salePrice"));
  const stock = asNumber(pick("stock"));
  const description = asText(pick("description"));
  const issues: string[] = [];

  if (!size) {
    const inferred = inferTrailingSize(name, itemCode);
    if (inferred) {
      size = inferred.size;
      name = inferred.baseName;
    }
  }

  if (!name && !itemCode && !barcode) issues.push("Missing name, item code, and barcode");
  if (price != null && price < 0) issues.push("Negative price");
  if (stock != null && (!Number.isInteger(stock) || stock < 0)) issues.push("Invalid stock");

  return {
    rowNumber,
    name,
    description,
    category,
    itemCode,
    groupKey,
    size,
    barcode,
    sku,
    price,
    salePrice,
    stock: stock == null ? null : Math.trunc(stock),
    raw: record,
    issues,
  };
}

export type GroupDecision =
  | { kind: "group"; key: string }
  | { kind: "review"; reason: string; key: string };

export function groupingKey(row: ParsedRow): GroupDecision {
  if (row.groupKey) {
    return { kind: "group", key: `g:${row.groupKey.toLowerCase()}` };
  }
  if (row.itemCode && row.size) {
    const parent = stripSizeSuffix(row.itemCode, row.size);
    if (parent && parent !== row.itemCode) {
      return { kind: "group", key: `code:${parent.toLowerCase()}` };
    }
    return { kind: "group", key: `code:${row.itemCode.toLowerCase()}` };
  }
  if (row.itemCode) {
    return { kind: "group", key: `code:${row.itemCode.toLowerCase()}` };
  }
  if (row.name && row.size) {
    const parent = stripSizeSuffix(row.name, row.size) || row.name;
    return { kind: "group", key: `name:${parent.toLowerCase()}` };
  }
  if (row.name) {
    const inferred = inferTrailingSize(row.name, row.itemCode);
    if (inferred) {
      return { kind: "group", key: `name:${inferred.baseName.toLowerCase()}` };
    }
  }
  if (row.name) {
    return { kind: "group", key: `solo:${row.barcode || row.name.toLowerCase()}:${row.rowNumber}` };
  }
  return { kind: "review", reason: "Cannot determine parent product", key: `unknown:${row.rowNumber}` };
}

export function expandSizeColumns(
  record: Record<string, unknown>,
  headers: string[],
): Array<{ size: string; stock: unknown }> {
  const sizes: Array<{ size: string; stock: unknown }> = [];
  for (const header of headers) {
    const match = header.trim().match(/^(?:size|sz)\s*[:\-]?\s*(\d{1,2}(?:\.\d)?)$/i);
    if (match) sizes.push({ size: match[1], stock: record[header] });
  }
  return sizes;
}
