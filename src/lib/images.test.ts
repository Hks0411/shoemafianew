import { describe, expect, it } from "vitest";
import { optimizedImageUrl } from "./images";

describe("Image URLs", () => {
  it("returns MySQL media paths unchanged", () => {
    expect(optimizedImageUrl("/api/media/clxyz123", 600)).toBe("/api/media/clxyz123");
  });

  it("returns other URLs unchanged", () => {
    expect(optimizedImageUrl("https://example.com/shoe.jpg", 600)).toBe("https://example.com/shoe.jpg");
  });
});
