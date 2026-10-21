import { describe, expect, it } from "vitest";
import { asBarcode, suggestMapping } from "./mapping";
import { expandSizeColumns, groupingKey, parseMappedRow, stripSizeSuffix } from "./group";

describe("Busy mapping", () => {
  it("suggests Busy-style headers", () => {
    const mapping = suggestMapping(["Item Name", "Item Code", "Barcode", "Size", "Selling Price", "Closing Stock"]);
    expect(mapping.name).toBe("Item Name");
    expect(mapping.itemCode).toBe("Item Code");
    expect(mapping.barcode).toBe("Barcode");
    expect(mapping.size).toBe("Size");
    expect(mapping.price).toBe("Selling Price");
    expect(mapping.stock).toBe("Closing Stock");
  });

  it("keeps barcode leading zeros as text", () => {
    expect(asBarcode("000123")).toBe("000123");
  });

  it("expands scientific-notation barcodes from Excel numbers", () => {
    expect(asBarcode("8.90123456789e+12")).toBe("8901234567890");
  });

  it("groups sizes of the same item code", () => {
    const mapping = { name: "n", itemCode: "c", size: "s" };
    const a = parseMappedRow(1, { n: "Runner", c: "RUN-01", s: "7" }, mapping);
    const b = parseMappedRow(2, { n: "Runner", c: "RUN-01", s: "8" }, mapping);
    expect(groupingKey(a).kind).toBe("group");
    expect(groupingKey(a).key).toBe(groupingKey(b).key);
  });

  it("strips a size suffix from an item code", () => {
    expect(stripSizeSuffix("RUN-01-8", "8")).toBe("RUN-01");
  });

  it("groups rows that share a name with a trailing size", () => {
    const mapping = { name: "n", size: "s", barcode: "b" };
    const a = parseMappedRow(1, { n: "Runner", s: "7", b: "111" }, mapping);
    const b = parseMappedRow(2, { n: "Runner", s: "8", b: "222" }, mapping);
    expect(groupingKey(a).kind).toBe("group");
    expect(groupingKey(a).key).toBe(groupingKey(b).key);
  });

  it("infers size from a trailing number in the item name", () => {
    const mapping = { name: "n", barcode: "b", price: "p" };
    const row = parseMappedRow(1, { n: "Classic Loafer 9", b: "9001", p: 999 }, mapping);
    expect(row.size).toBe("9");
    expect(row.name).toBe("Classic Loafer");
  });

  it("maps Busy category headers", () => {
    const mapping = suggestMapping(["Item Name", "Category", "Barcode", "Size", "Selling Price"]);
    expect(mapping.category).toBe("Category");
  });

  it("expands Busy size columns into variations", () => {
    const cols = expandSizeColumns({ "Size 6": 4, "Size 7": 2, Name: "Runner" }, ["Name", "Size 6", "Size 7"]);
    expect(cols).toEqual([
      { size: "6", stock: 4 },
      { size: "7", stock: 2 },
    ]);
  });
});
