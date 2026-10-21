export function cellToValue(value: unknown): unknown {
  if (value == null || value === "") return "";
  if (typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "number") return value;
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) {
    return value
      .map((part) => {
        if (part && typeof part === "object" && "text" in part) {
          return String((part as { text?: string }).text || "");
        }
        return String(cellToValue(part) ?? "");
      })
      .join("");
  }
  if (typeof value === "object") {
    const rec = value as {
      text?: string;
      result?: unknown;
      richText?: Array<{ text?: string }>;
      hyperlink?: string;
    };
    if (typeof rec.text === "string" && rec.text.length) return rec.text;
    if (Array.isArray(rec.richText)) {
      return rec.richText.map((part) => part.text || "").join("");
    }
    if ("result" in rec) return cellToValue(rec.result);
  }
  return value;
}
