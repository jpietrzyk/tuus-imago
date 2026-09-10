import { describe, it, expect, vi, beforeEach } from "vitest";

const mockLoadImageDimensions = vi.hoisted(() => vi.fn());

vi.mock("./load-image-dimensions", () => ({
  loadImageDimensions: mockLoadImageDimensions,
}));

import { validateImageFile } from "./image-file-validator";
import { IMAGE_VALIDATION_RULES } from "./image-validation-rules";

const RULES = IMAGE_VALIDATION_RULES;

describe("validateImageFile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoadImageDimensions.mockResolvedValue({
      width: 3000,
      height: 2000,
    });
  });

  it("rejects invalid MIME type", async () => {
    const file = new File(["x"], "test.gif", { type: "image/gif" });
    const { violations } = await validateImageFile(file, RULES);

    expect(violations).toHaveLength(1);
    expect(violations[0].rule).toBe("invalidType");
    expect(violations[0].messageKey).toBe("upload.validation.invalidType");
  });

  it("rejects oversized file", async () => {
    const smallRules = { ...RULES, maxFileSizeBytes: 100 };
    const file = new File(
      new Array(200).fill("x"),
      "big.jpg",
      { type: "image/jpeg" },
    );

    const { violations } = await validateImageFile(file, smallRules);

    expect(violations).toHaveLength(1);
    expect(violations[0].rule).toBe("maxFileSize");
    expect(violations[0].messageKey).toBe("upload.validation.maxFileSize");
  });

  it("accepts a small square image (DPI evaluated in the editor, not at selection)", async () => {
    mockLoadImageDimensions.mockResolvedValue({
      width: 1000,
      height: 1000,
    });

    const file = new File(["x"], "small.jpg", { type: "image/jpeg" });
    const { violations, dimensions } = await validateImageFile(file, RULES);

    expect(violations).toHaveLength(0);
    expect(dimensions).toEqual({ width: 1000, height: 1000 });
  });

  it("accepts a portrait image below the resolution requirement", async () => {
    mockLoadImageDimensions.mockResolvedValue({
      width: 1500,
      height: 2250,
    });

    const file = new File(["x"], "vertical-low.jpg", { type: "image/jpeg" });
    const { violations, dimensions } = await validateImageFile(file, RULES);

    expect(violations).toHaveLength(0);
    expect(dimensions).toEqual({ width: 1500, height: 2250 });
  });

  it("returns no violations for an image with sufficient resolution", async () => {
    mockLoadImageDimensions.mockResolvedValue({
      width: 3000,
      height: 2000,
    });

    const file = new File(["x"], "valid.jpg", { type: "image/jpeg" });
    const { violations } = await validateImageFile(file, RULES);

    expect(violations).toHaveLength(0);
  });

  it("accepts any decodable image regardless of resolution", async () => {
    mockLoadImageDimensions.mockResolvedValue({
      width: 3000,
      height: 2000,
    });

    const file = new File(["x"], "test.webp", { type: "image/webp" });
    const { violations } = await validateImageFile(file, RULES);

    expect(violations).toHaveLength(0);
  });

  it("returns invalidImage when image fails to load", async () => {
    mockLoadImageDimensions.mockRejectedValue(new Error("Failed to load image"));

    const file = new File(["x"], "broken.jpg", { type: "image/jpeg" });
    const { violations, dimensions } = await validateImageFile(file, RULES);

    expect(violations).toHaveLength(1);
    expect(violations[0].rule).toBe("invalidImage");
    expect(dimensions).toBeNull();
  });

  it("stops checking after invalid MIME type without loading image", async () => {
    const file = new File(["x"], "data.gif", {
      type: "image/gif",
    });
    const { violations } = await validateImageFile(file, RULES);

    expect(violations).toHaveLength(1);
    expect(violations[0].rule).toBe("invalidType");
    expect(mockLoadImageDimensions).not.toHaveBeenCalled();
  });

  it("stops checking after file size violation without loading image", async () => {
    const smallRules = { ...RULES, maxFileSizeBytes: 100 };
    const file = new File(
      new Array(200).fill("x"),
      "big.jpg",
      { type: "image/jpeg" },
    );
    const { violations } = await validateImageFile(file, smallRules);

    expect(violations).toHaveLength(1);
    expect(violations[0].rule).toBe("maxFileSize");
    expect(mockLoadImageDimensions).not.toHaveBeenCalled();
  });

  it("accepts very small images (DPI guard no longer applies at selection)", async () => {
    mockLoadImageDimensions.mockResolvedValue({
      width: 1080,
      height: 1080,
    });

    const file = new File(["x"], "small.jpg", { type: "image/jpeg" });
    const { violations } = await validateImageFile(file, RULES);

    expect(violations).toHaveLength(0);
  });
});
