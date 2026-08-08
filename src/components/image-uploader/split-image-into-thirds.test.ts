import { afterEach, describe, expect, it, vi } from "vitest";
import { splitImageIntoVerticalThirdFiles } from "./split-image-into-thirds";
import * as canvasUtils from "./preview-canvas-utils";

describe("split-image-into-thirds", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("splits image into left, center and right files", async () => {
    const drawImageCalls: Array<number[]> = [];
    const originalCreateElement = document.createElement.bind(document);

    vi.spyOn(canvasUtils, "loadImageElement").mockResolvedValue(
      document.createElement("img"),
    );
    vi.spyOn(canvasUtils, "resolveImageDimensions").mockReturnValue({
      sourceWidth: 1000,
      sourceHeight: 600,
    });

    vi.spyOn(document, "createElement").mockImplementation(
      ((tagName: string) => {
        if (tagName !== "canvas") {
          return originalCreateElement(tagName);
        }

        const drawImage = vi.fn((...args: number[]) => {
          drawImageCalls.push(args);
        });

        const canvas = {
          width: 0,
          height: 0,
          getContext: () => ({
            drawImage,
          }),
          toBlob: (callback: BlobCallback, type?: string) => {
            callback(new Blob(["part"], { type: type ?? "image/png" }));
          },
          toDataURL: () => "",
        };

        return canvas as unknown as HTMLCanvasElement;
      }) as typeof document.createElement,
    );

    const sourceFile = new File(["source"], "photo.jpg", {
      type: "image/jpeg",
    });

    const parts = await splitImageIntoVerticalThirdFiles({
      previewUrl: "blob:source",
      sourceFile,
    });

    expect(parts).toHaveLength(3);
    expect(parts.map((file) => file.name)).toEqual([
      "photo-part-1.jpg",
      "photo-part-2.jpg",
      "photo-part-3.jpg",
    ]);
    expect(parts.every((file) => file.type === "image/jpeg")).toBe(true);

    expect(drawImageCalls).toHaveLength(3);
    expect(drawImageCalls[0]?.slice(1, 5)).toEqual([0, 0, 333, 600]);
    expect(drawImageCalls[1]?.slice(1, 5)).toEqual([333, 0, 333, 600]);
    expect(drawImageCalls[2]?.slice(1, 5)).toEqual([666, 0, 334, 600]);
  });

  it("falls back to png mime type for unsupported source type", async () => {
    vi.spyOn(canvasUtils, "loadImageElement").mockResolvedValue(
      document.createElement("img"),
    );
    vi.spyOn(canvasUtils, "resolveImageDimensions").mockReturnValue({
      sourceWidth: 300,
      sourceHeight: 300,
    });

    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation(
      ((tagName: string) => {
        if (tagName !== "canvas") {
          return originalCreateElement(tagName);
        }

        return {
          width: 0,
          height: 0,
          getContext: () => ({
            drawImage: vi.fn(),
          }),
          toBlob: (callback: BlobCallback) => {
            callback(new Blob(["part"], { type: "image/png" }));
          },
          toDataURL: () => "",
        } as unknown as HTMLCanvasElement;
      }) as typeof document.createElement,
    );

    const sourceFile = new File(["source"], "raw-image.tiff", {
      type: "image/tiff",
    });

    const parts = await splitImageIntoVerticalThirdFiles({
      previewUrl: "blob:source",
      sourceFile,
    });

    expect(parts.map((file) => file.name)).toEqual([
      "raw-image-part-1.png",
      "raw-image-part-2.png",
      "raw-image-part-3.png",
    ]);
    expect(parts.every((file) => file.type === "image/png")).toBe(true);
  });

  it("bakes rotation/crop into a composed canvas before slicing", async () => {
    const drawImageCalls: Array<number[]> = [];
    const originalCreateElement = document.createElement.bind(document);

    vi.spyOn(canvasUtils, "loadImageElement").mockResolvedValue(
      document.createElement("img"),
    );
    vi.spyOn(canvasUtils, "resolveImageDimensions").mockReturnValue({
      sourceWidth: 900,
      sourceHeight: 600,
    });

    vi.spyOn(document, "createElement").mockImplementation(
      ((tagName: string) => {
        if (tagName !== "canvas") {
          return originalCreateElement(tagName);
        }

        const drawImage = vi.fn((...args: number[]) => {
          drawImageCalls.push(args);
        });

        const canvas = {
          width: 0,
          height: 0,
          getContext: () => ({
            drawImage,
            save: vi.fn(),
            restore: vi.fn(),
            translate: vi.fn(),
            rotate: vi.fn(),
            scale: vi.fn(),
          }),
          toBlob: (callback: BlobCallback, type?: string) => {
            callback(new Blob(["part"], { type: type ?? "image/png" }));
          },
          toDataURL: () => "",
        };

        return canvas as unknown as HTMLCanvasElement;
      }) as typeof document.createElement,
    );

    const sourceFile = new File(["source"], "photo.jpg", {
      type: "image/jpeg",
    });

    const parts = await splitImageIntoVerticalThirdFiles({
      previewUrl: "blob:source",
      sourceFile,
      metadata: { width: 900, height: 600 },
      proportion: "horizontal",
      previewTransform: { rotation: 180, flipHorizontal: false, flipVertical: false },
      previewCropAdjust: { zoom: 1, panX: 0, panY: 0 },
    });

    expect(parts).toHaveLength(3);

    // 1 compose draw + 3 slice draws
    expect(drawImageCalls).toHaveLength(4);
    // First call is the compose draw: full crop region
    expect(drawImageCalls[0]?.slice(1, 5)).toEqual([0, 0, 900, 600]);
    // Following three calls slice the 900px composed width into thirds
    expect(drawImageCalls[1]?.slice(1, 5)).toEqual([0, 0, 300, 600]);
    expect(drawImageCalls[2]?.slice(1, 5)).toEqual([300, 0, 300, 600]);
    expect(drawImageCalls[3]?.slice(1, 5)).toEqual([600, 0, 300, 600]);
  });

  it("inverts the proportion for quarter-turn rotations before composing", async () => {
    const drawImageCalls: Array<number[]> = [];
    const originalCreateElement = document.createElement.bind(document);

    vi.spyOn(canvasUtils, "loadImageElement").mockResolvedValue(
      document.createElement("img"),
    );
    vi.spyOn(canvasUtils, "resolveImageDimensions").mockReturnValue({
      sourceWidth: 900,
      sourceHeight: 600,
    });

    vi.spyOn(document, "createElement").mockImplementation(
      ((tagName: string) => {
        if (tagName !== "canvas") {
          return originalCreateElement(tagName);
        }

        const drawImage = vi.fn((...args: number[]) => {
          drawImageCalls.push(args);
        });

        const canvas = {
          width: 0,
          height: 0,
          getContext: () => ({
            drawImage,
            save: vi.fn(),
            restore: vi.fn(),
            translate: vi.fn(),
            rotate: vi.fn(),
            scale: vi.fn(),
          }),
          toBlob: (callback: BlobCallback, type?: string) => {
            callback(new Blob(["part"], { type: type ?? "image/png" }));
          },
          toDataURL: () => "",
        };

        return canvas as unknown as HTMLCanvasElement;
      }) as typeof document.createElement,
    );

    const sourceFile = new File(["source"], "photo.jpg", {
      type: "image/jpeg",
    });

    await splitImageIntoVerticalThirdFiles({
      previewUrl: "blob:source",
      sourceFile,
      metadata: { width: 900, height: 600 },
      proportion: "horizontal",
      previewTransform: { rotation: 90, flipHorizontal: false, flipVertical: false },
      previewCropAdjust: { zoom: 1, panX: 0, panY: 0 },
    });

    // 90° rotation inverts "horizontal" → "vertical" proportion, so the base
    // crop selects a centered ~400×600 vertical strip (cropX=250) rather than
    // the full 900×600. This matches what the live preview shows.
    expect(drawImageCalls).toHaveLength(4);
    expect(drawImageCalls[0]?.slice(1, 5)).toEqual([250, 0, 400, 600]);
  });

  it("slices the crop directly without a compose canvas when only zoom is applied", async () => {
    const drawImageCalls: Array<number[]> = [];
    const originalCreateElement = document.createElement.bind(document);

    vi.spyOn(canvasUtils, "loadImageElement").mockResolvedValue(
      document.createElement("img"),
    );
    vi.spyOn(canvasUtils, "resolveImageDimensions").mockReturnValue({
      sourceWidth: 900,
      sourceHeight: 600,
    });

    vi.spyOn(document, "createElement").mockImplementation(
      ((tagName: string) => {
        if (tagName !== "canvas") {
          return originalCreateElement(tagName);
        }

        const drawImage = vi.fn((...args: number[]) => {
          drawImageCalls.push(args);
        });

        const canvas = {
          width: 0,
          height: 0,
          getContext: () => ({
            drawImage,
          }),
          toBlob: (callback: BlobCallback, type?: string) => {
            callback(new Blob(["part"], { type: type ?? "image/png" }));
          },
          toDataURL: () => "",
        };

        return canvas as unknown as HTMLCanvasElement;
      }) as typeof document.createElement,
    );

    const sourceFile = new File(["source"], "photo.jpg", {
      type: "image/jpeg",
    });

    await splitImageIntoVerticalThirdFiles({
      previewUrl: "blob:source",
      sourceFile,
      metadata: { width: 900, height: 600 },
      proportion: "horizontal",
      previewTransform: { rotation: 0, flipHorizontal: false, flipVertical: false },
      previewCropAdjust: { zoom: 2, panX: 0, panY: 0 },
    });

    // No compose canvas: only the 3 direct slice draws. zoom 2 on a 900×600
    // horizontal crop centers a 450×300 region (cropX=225, cropY=150).
    expect(drawImageCalls).toHaveLength(3);
    expect(drawImageCalls[0]?.slice(1, 5)).toEqual([225, 150, 150, 300]);
    expect(drawImageCalls[1]?.slice(1, 5)).toEqual([375, 150, 150, 300]);
    expect(drawImageCalls[2]?.slice(1, 5)).toEqual([525, 150, 150, 300]);
  });

  it("skips composition when transform and crop are identity", async () => {
    const drawImageCalls: Array<number[]> = [];
    const originalCreateElement = document.createElement.bind(document);

    vi.spyOn(canvasUtils, "loadImageElement").mockResolvedValue(
      document.createElement("img"),
    );
    vi.spyOn(canvasUtils, "resolveImageDimensions").mockReturnValue({
      sourceWidth: 900,
      sourceHeight: 600,
    });

    vi.spyOn(document, "createElement").mockImplementation(
      ((tagName: string) => {
        if (tagName !== "canvas") {
          return originalCreateElement(tagName);
        }

        const drawImage = vi.fn((...args: number[]) => {
          drawImageCalls.push(args);
        });

        const canvas = {
          width: 0,
          height: 0,
          getContext: () => ({
            drawImage,
          }),
          toBlob: (callback: BlobCallback, type?: string) => {
            callback(new Blob(["part"], { type: type ?? "image/png" }));
          },
          toDataURL: () => "",
        };

        return canvas as unknown as HTMLCanvasElement;
      }) as typeof document.createElement,
    );

    const sourceFile = new File(["source"], "photo.jpg", {
      type: "image/jpeg",
    });

    await splitImageIntoVerticalThirdFiles({
      previewUrl: "blob:source",
      sourceFile,
      metadata: { width: 900, height: 600 },
      proportion: "horizontal",
      previewTransform: { rotation: 0, flipHorizontal: false, flipVertical: false },
      previewCropAdjust: { zoom: 1, panX: 0, panY: 0 },
    });

    // No compose canvas, only the 3 slice draws
    expect(drawImageCalls).toHaveLength(3);
  });
});
