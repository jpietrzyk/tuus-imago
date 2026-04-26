import { describe, it, expect, vi, beforeEach } from "vitest";

const mockLoadImageDimensions = vi.hoisted(() => vi.fn());
const mockReadJpegExifResolution = vi.hoisted(() => vi.fn());

vi.mock("./load-image-dimensions", () => ({
  loadImageDimensions: mockLoadImageDimensions,
}));

vi.mock("./jpeg-exif-reader", () => ({
  readJpegExifResolution: mockReadJpegExifResolution,
}));

import { validateImageFile, extractPngDpi } from "./image-file-validator";
import { IMAGE_VALIDATION_RULES } from "./image-validation-rules";

const RULES = IMAGE_VALIDATION_RULES;

describe("validateImageFile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockReadJpegExifResolution.mockResolvedValue(null);
    mockLoadImageDimensions.mockResolvedValue({
      width: RULES.minWidth,
      height: RULES.minHeight,
    });
  });

  it("rejects invalid MIME type", async () => {
    const file = new File(["x"], "test.gif", { type: "image/gif" });
    const violations = await validateImageFile(file, RULES);

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

    const violations = await validateImageFile(file, smallRules);

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
    const violations = await validateImageFile(file, RULES);

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
    const violations = await validateImageFile(file, RULES);

    expect(violations.length).toBeGreaterThanOrEqual(1);
    const heightViolation = violations.find((v) => v.rule === "minHeight");
    expect(heightViolation).toBeDefined();
    expect(heightViolation!.params.minHeight).toBe(RULES.minHeight);
    expect(heightViolation!.params.actualHeight).toBe(RULES.minHeight - 1);
  });

  it("returns no violations for a valid JPEG with sufficient resolution and DPI", async () => {
    mockReadJpegExifResolution.mockResolvedValue({
      xResolution: 300,
      yResolution: 300,
      resolutionUnit: 2,
    });

    const file = new File(["x"], "valid.jpg", { type: "image/jpeg" });
    const violations = await validateImageFile(file, RULES);

    expect(violations).toHaveLength(0);
  });

  it("rejects JPEG with DPI below minimum", async () => {
    mockReadJpegExifResolution.mockResolvedValue({
      xResolution: 72,
      yResolution: 72,
      resolutionUnit: 2,
    });

    const file = new File(["x"], "lowdpi.jpg", { type: "image/jpeg" });
    const violations = await validateImageFile(file, RULES);

    expect(violations).toHaveLength(1);
    expect(violations[0].rule).toBe("minDpi");
    expect(violations[0].messageKey).toBe("upload.validation.minDpi");
    expect(violations[0].params.actualDpi).toBe(72);
    expect(violations[0].params.minDpi).toBe(RULES.minDpi);
  });

  it("passes JPEG with DPI equal to minimum", async () => {
    mockReadJpegExifResolution.mockResolvedValue({
      xResolution: RULES.minDpi,
      yResolution: RULES.minDpi,
      resolutionUnit: 2,
    });

    const file = new File(["x"], "exactdpi.jpg", { type: "image/jpeg" });
    const violations = await validateImageFile(file, RULES);

    expect(violations).toHaveLength(0);
  });

  it("skips DPI check when EXIF has no resolution data", async () => {
    mockReadJpegExifResolution.mockResolvedValue(null);

    const file = new File(["x"], "noexif.jpg", { type: "image/jpeg" });
    const violations = await validateImageFile(file, RULES);

    expect(violations).toHaveLength(0);
  });

  it("skips DPI check for WebP files", async () => {
    const file = new File(["x"], "test.webp", { type: "image/webp" });
    const violations = await validateImageFile(file, RULES);

    expect(violations).toHaveLength(0);
    expect(mockReadJpegExifResolution).not.toHaveBeenCalled();
  });

  it("returns invalidImage when image fails to load", async () => {
    mockLoadImageDimensions.mockRejectedValue(new Error("Failed to load image"));

    const file = new File(["x"], "broken.jpg", { type: "image/jpeg" });
    const violations = await validateImageFile(file, RULES);

    expect(violations).toHaveLength(1);
    expect(violations[0].rule).toBe("invalidImage");
  });

  it("stops checking after invalid MIME type without loading image", async () => {
    const file = new File(["x"], "data.gif", {
      type: "image/gif",
    });
    const violations = await validateImageFile(file, RULES);

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
    const violations = await validateImageFile(file, smallRules);

    expect(violations).toHaveLength(1);
    expect(violations[0].rule).toBe("maxFileSize");
    expect(mockLoadImageDimensions).not.toHaveBeenCalled();
    expect(mockReadJpegExifResolution).not.toHaveBeenCalled();
  });

  it("does not check DPI when dimension violations exist", async () => {
    mockLoadImageDimensions.mockResolvedValue({
      width: RULES.minWidth - 1,
      height: RULES.minHeight,
    });
    mockReadJpegExifResolution.mockResolvedValue({
      xResolution: 50,
      yResolution: 50,
      resolutionUnit: 2,
    });

    const file = new File(["x"], "small.jpg", { type: "image/jpeg" });
    const violations = await validateImageFile(file, RULES);

    const hasMinWidth = violations.some((v) => v.rule === "minWidth");
    expect(hasMinWidth).toBe(true);
    const hasMinDpi = violations.some((v) => v.rule === "minDpi");
    expect(hasMinDpi).toBe(false);
  });
});

describe("extractPngDpi", () => {
  function buildPngWithPhys(
    pixelsPerUnitX: number,
    pixelsPerUnitY: number,
    unit: number,
  ): File {
    const signature = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);

    const chunkLength = 9;
    const chunkData = new Uint8Array(chunkLength);
    const dataView = new DataView(chunkData.buffer);
    dataView.setUint32(0, pixelsPerUnitX);
    dataView.setUint32(4, pixelsPerUnitY);
    dataView.setUint8(8, unit);

    const chunkType = new Uint8Array([0x70, 0x48, 0x59, 0x73]);
    const lengthField = new Uint8Array(4);
    new DataView(lengthField.buffer).setUint32(0, chunkLength);
    const crc = new Uint8Array(4);

    const combined = new Uint8Array(
      signature.length + lengthField.length + chunkType.length + chunkData.length + crc.length,
    );
    let offset = 0;
    combined.set(signature, offset);
    offset += signature.length;
    combined.set(lengthField, offset);
    offset += lengthField.length;
    combined.set(chunkType, offset);
    offset += chunkType.length;
    combined.set(chunkData, offset);
    offset += chunkData.length;
    combined.set(crc, offset);

    return new File([combined], "test.png", { type: "image/png" });
  }

  it("extracts DPI from PNG pHYs chunk with meter unit", async () => {
    const dpi = 300;
    const ppm = Math.round(dpi / 0.0254);
    const file = buildPngWithPhys(ppm, ppm, 1);
    const result = await extractPngDpi(file);

    expect(result).toBe(dpi);
  });

  it("returns null for PNG with unknown unit", async () => {
    const file = buildPngWithPhys(2835, 2835, 0);
    const result = await extractPngDpi(file);

    expect(result).toBeNull();
  });

  it("returns null for file without pHYs chunk", async () => {
    const signature = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
    const idatLength = new Uint8Array(4);
    const idatType = new Uint8Array([0x49, 0x44, 0x41, 0x54]);
    const idatCrc = new Uint8Array(4);

    const combined = new Uint8Array(
      signature.length + idatLength.length + idatType.length + idatCrc.length,
    );
    let offset = 0;
    combined.set(signature, offset);
    offset += signature.length;
    combined.set(idatLength, offset);
    offset += idatLength.length;
    combined.set(idatType, offset);
    offset += idatType.length;
    combined.set(idatCrc, offset);

    const file = new File([combined], "test.png", { type: "image/png" });
    const result = await extractPngDpi(file);

    expect(result).toBeNull();
  });

  it("returns null for non-PNG file", async () => {
    const file = new File(["not a png"], "test.png", { type: "image/png" });
    const result = await extractPngDpi(file);

    expect(result).toBeNull();
  });
});
