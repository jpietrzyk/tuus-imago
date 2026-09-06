import { describe, it, expect, vi, beforeEach } from "vitest";

const mockLoadImageDimensions = vi.hoisted(() => vi.fn());
const dpiRulesState = vi.hoisted(() => ({ minDpi: 72, guardEnabled: true }));

vi.mock("./load-image-dimensions", () => ({
  loadImageDimensions: mockLoadImageDimensions,
}));

vi.mock("./image-dpi-rules", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./image-dpi-rules")>();
  return {
    ...actual,
    get IMAGE_DPI_RULES() {
      return {
        ...actual.IMAGE_DPI_RULES,
        minDpi: dpiRulesState.minDpi,
        guardEnabled: dpiRulesState.guardEnabled,
      };
    },
  };
});

import { validateImageFile } from "./image-file-validator";
import { IMAGE_VALIDATION_RULES } from "./image-validation-rules";

const RULES = IMAGE_VALIDATION_RULES;

describe("validateImageFile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dpiRulesState.minDpi = 72;
    dpiRulesState.guardEnabled = true;
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

  it("rejects a square image below the square reference print resolution", async () => {
    mockLoadImageDimensions.mockResolvedValue({
      width: 1000,
      height: 1000,
    });

    const file = new File(["x"], "small.jpg", { type: "image/jpeg" });
    const { violations } = await validateImageFile(file, RULES);

    expect(violations).toHaveLength(1);
    expect(violations[0].rule).toBe("minDpi");
    expect(violations[0].messageKey).toBe("upload.validation.minDpi");
    expect(violations[0].params.minDpi).toBe(72);
    expect(violations[0].params.actualDpi).toBe(42);
    expect(violations[0].params.width).toBe(1000);
    expect(violations[0].params.height).toBe(1000);
    // Square 60x60 cm reference at 72 DPI needs ~1701 px per side.
    expect(violations[0].params.minWidth).toBe(1701);
    expect(violations[0].params.minHeight).toBe(1701);
  });

  it("accepts a portrait image that meets the DPI in its optimal orientation", async () => {
    mockLoadImageDimensions.mockResolvedValue({
      width: 2000,
      height: 3000,
    });

    const file = new File(["x"], "vertical.jpg", { type: "image/jpeg" });
    const { violations } = await validateImageFile(file, RULES);

    expect(violations).toHaveLength(0);
  });

  it("reports DPI for a portrait image below the resolution requirement", async () => {
    mockLoadImageDimensions.mockResolvedValue({
      width: 1500,
      height: 2250,
    });

    const file = new File(["x"], "vertical-low.jpg", { type: "image/jpeg" });
    const { violations } = await validateImageFile(file, RULES);

    expect(violations).toHaveLength(1);
    expect(violations[0].rule).toBe("minDpi");
    expect(violations[0].messageKey).toBe("upload.validation.minDpi");
    expect(violations[0].params.actualDpi).toBe(63);
    expect(violations[0].params.minDpi).toBe(72);
    expect(violations[0].params.width).toBe(1500);
    expect(violations[0].params.height).toBe(2250);
    // Portrait image matches the 60x90 cm orientation: needs ~1701 x ~2552 px.
    expect(violations[0].params.minWidth).toBe(1701);
    expect(violations[0].params.minHeight).toBe(2552);
    expect(violations.some((v) => v.rule === "minWidth")).toBe(false);
  });

  it("returns no violations for an image with sufficient resolution for default print size", async () => {
    mockLoadImageDimensions.mockResolvedValue({
      width: 3000,
      height: 2000,
    });

    const file = new File(["x"], "valid.jpg", { type: "image/jpeg" });
    const { violations } = await validateImageFile(file, RULES);

    expect(violations).toHaveLength(0);
  });

  it("rejects image with DPI below minimum for reference print size (90x60 cm)", async () => {
    dpiRulesState.minDpi = 150;
    mockLoadImageDimensions.mockResolvedValue({
      width: 3000,
      height: 2000,
    });

    const file = new File(["x"], "lowdpi.jpg", { type: "image/jpeg" });
    const { violations } = await validateImageFile(file, RULES);

    expect(violations).toHaveLength(1);
    expect(violations[0].rule).toBe("minDpi");
    expect(violations[0].messageKey).toBe("upload.validation.minDpi");
    expect(violations[0].params.actualDpi).toBe(84);
    expect(violations[0].params.minDpi).toBe(150);
  });

  it("passes image with DPI equal to minimum for reference print size", async () => {
    mockLoadImageDimensions.mockResolvedValue({
      width: 2552,
      height: 1701,
    });

    const file = new File(["x"], "exactdpi.jpg", { type: "image/jpeg" });
    const { violations } = await validateImageFile(file, RULES);

    expect(violations).toHaveLength(0);
  });

  it("applies dynamic DPI check consistently across all file types", async () => {
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
    const { violations } = await validateImageFile(file, RULES);

    expect(violations).toHaveLength(1);
    expect(violations[0].rule).toBe("invalidImage");
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

  it("checks DPI for any image when the guard is enabled", async () => {
    mockLoadImageDimensions.mockResolvedValue({
      width: 1000,
      height: 1000,
    });

    const file = new File(["x"], "small.jpg", { type: "image/jpeg" });
    const { violations } = await validateImageFile(file, RULES);

    const hasMinDpi = violations.some((v) => v.rule === "minDpi");
    expect(hasMinDpi).toBe(true);
  });

  it("accepts images below minimum dimensions when the DPI guard is off", async () => {
    dpiRulesState.guardEnabled = false;
    mockLoadImageDimensions.mockResolvedValue({
      width: 1080,
      height: 1080,
    });

    const file = new File(["x"], "small.jpg", { type: "image/jpeg" });
    const { violations } = await validateImageFile(file, RULES);

    expect(violations).toHaveLength(0);
  });
});
