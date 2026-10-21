import { describe, expect, it } from "vitest";
import { cellToValue } from "./cell";

describe("Excel cell values", () => {
  it("prefers displayed text so barcodes stay strings", () => {
    expect(cellToValue({ text: "000123" })).toBe("000123");
  });

  it("joins rich text", () => {
    expect(cellToValue({ richText: [{ text: "RUN" }, { text: "-01" }] })).toBe("RUN-01");
  });
});
