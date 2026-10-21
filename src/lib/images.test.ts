import { describe, expect, it } from "vitest";
import { optimizedImageUrl } from "./images";

describe("Image URLs", () => {
  it("leaves MySQL media paths unchanged", () => {
    expect(optimizedImageUrl("/api/media/clxyz123", 600)).toBe("/api/media/clxyz123");
  });

  it("still optimizes legacy Cloudinary URLs if present", () => {
    const url = "https://res.cloudinary.com/demo/image/upload/v1/shoe.jpg";
    expect(optimizedImageUrl(url, 600)).toBe(
      "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,c_fill,w_600/v1/shoe.jpg",
    );
  });
});
