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
      width: RULES.minWidth,
      height: RULES.minHeight,
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

  it("rejects image below minimum width", async () => {
    mockLoadImageDimensions.mockResolvedValue({
      width: RULES.minWidth - 1,
      height: RULES.minHeight,
    });

    const file = new File(["x"], "narrow.jpg", { type: "image/jpeg" });
    const { violations } = await validateImageFile(file, RULES);

    expect(violations.length).toBeGreaterThanOrEqual(1);
    const widthViolation = violations.find((v) => v.rule === "minWidth");
    expect(widthViolation).toBeDefined();
    expect(widthViolation!.params.minWidth).toBe(RULES.minWidth);
    expect(widthViolation!.params.actualWidth).toBe(RULES.minWidth - 1);
  });

  it("rejects image below minimum height", async () => {
    mockLoadImageDimensions.mockResolvedValue({
      width: RULES.minWidth,
      height: RULES.minHeight - 1,
    });

    const file = new File(["x"], "short.jpg", { type: "image/jpeg" });
    const { violations } = await validateImageFile(file, RULES);

    expect(violations.length).toBeGreaterThanOrEqual(1);
    const heightViolation = violations.find((v) => v.rule === "minHeight");
    expect(heightViolation).toBeDefined();
    expect(heightViolation!.params.minHeight).toBe(RULES.minHeight);
    expect(heightViolation!.params.actualHeight).toBe(RULES.minHeight - 1);
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

  it("does not check DPI when dimension violations exist", async () => {
    mockLoadImageDimensions.mockResolvedValue({
      width: RULES.minWidth - 1,
      height: RULES.minHeight,
    });

    const file = new File(["x"], "small.jpg", { type: "image/jpeg" });
    const { violations } = await validateImageFile(file, RULES);

    const hasMinWidth = violations.some((v) => v.rule === "minWidth");
    expect(hasMinWidth).toBe(true);
    const hasMinDpi = violations.some((v) => v.rule === "minDpi");
    expect(hasMinDpi).toBe(false);
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
