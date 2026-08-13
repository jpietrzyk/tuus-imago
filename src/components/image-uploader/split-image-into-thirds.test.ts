import { afterEach, describe, expect, it, vi } from "vitest";
import { splitImageIntoVerticalThirdFiles, composeFullTransformedImage } from "./split-image-into-thirds";
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

describe("composeFullTransformedImage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const setupCanvasMock = (
    sourceWidth: number,
    sourceHeight: number,
    transform: { rotation?: number; flipHorizontal?: boolean; flipVertical?: boolean } | null,
  ) => {
    const contextCalls: Array<{ method: string; args: number[] }> = [];
    const canvasDims = { width: 0, height: 0 };

    vi.spyOn(canvasUtils, "loadImageElement").mockResolvedValue(
      document.createElement("img"),
    );
    vi.spyOn(canvasUtils, "resolveImageDimensions").mockReturnValue({
      sourceWidth,
      sourceHeight,
    });

    const record = (method: string) =>
      vi.fn((...args: number[]) => contextCalls.push({ method, args }));

    vi.spyOn(document, "createElement").mockImplementation(
      ((tagName: string) => {
        if (tagName !== "canvas") {
          return (document.createElement as typeof document.createElement).call(
            document,
            tagName,
          );
        }

        const canvas = {
          get width() {
            return canvasDims.width;
          },
          set width(v: number) {
            canvasDims.width = v;
          },
          get height() {
            return canvasDims.height;
          },
          set height(v: number) {
            canvasDims.height = v;
          },
          getContext: () => ({
            save: record("save"),
            translate: record("translate"),
            rotate: record("rotate"),
            scale: record("scale"),
            restore: record("restore"),
            drawImage: vi.fn((...args: unknown[]) =>
              // First arg is the image source; record geometry args only.
              contextCalls.push({
                method: "drawImage",
                args: args.slice(1) as number[],
              }),
            ),
          }),
          toBlob: (callback: BlobCallback, type?: string) => {
            callback(new Blob(["composed"], { type: type ?? "image/png" }));
          },
          toDataURL: () => "",
        };

        return canvas as unknown as HTMLCanvasElement;
      }) as typeof document.createElement,
    );

    return { contextCalls, getCanvasDims: () => canvasDims, transform };
  };

  it("keeps source dimensions and draws the full image for an identity transform", async () => {
    const { contextCalls, getCanvasDims } = setupCanvasMock(1000, 600, null);

    const result = await composeFullTransformedImage({
      previewUrl: "blob:source",
      sourceFile: new File(["source"], "photo.jpg", { type: "image/jpeg" }),
      previewTransform: { rotation: 0, flipHorizontal: false, flipVertical: false },
    });

    expect(result.width).toBe(1000);
    expect(result.height).toBe(600);
    expect(getCanvasDims()).toEqual({ width: 1000, height: 600 });
    expect(result.file.type).toBe("image/jpeg");

    // One drawImage of the full image centred at origin (-500, -300, 1000, 600).
    const draw = contextCalls.find((c) => c.method === "drawImage");
    expect(draw?.args).toEqual([-500, -300, 1000, 600]);
    // Identity rotation is baked as a 0-radian rotate (no visual effect).
    const rotate = contextCalls.find((c) => c.method === "rotate");
    expect(rotate?.args[0]).toBe(0);
    // No flip scaling for identity.
    expect(contextCalls.some((c) => c.method === "scale")).toBe(false);
  });

  it("swaps canvas dimensions and draw rect for a 90° rotation", async () => {
    const { contextCalls, getCanvasDims } = setupCanvasMock(
      3000,
      1000,
      { rotation: 90 },
    );

    const result = await composeFullTransformedImage({
      previewUrl: "blob:source",
      sourceFile: new File(["source"], "pano.jpg", { type: "image/jpeg" }),
      previewTransform: { rotation: 90, flipHorizontal: false, flipVertical: false },
    });

    // 90° swaps axes: 3000×1000 -> 1000×3000.
    expect(result.width).toBe(1000);
    expect(result.height).toBe(3000);
    expect(getCanvasDims()).toEqual({ width: 1000, height: 3000 });

    // Rect dims are swapped (rectW=1000, rectH=3000) so drawImage is centred.
    const draw = contextCalls.find((c) => c.method === "drawImage");
    expect(draw?.args).toEqual([-500, -1500, 1000, 3000]);
    const rotate = contextCalls.find((c) => c.method === "rotate");
    expect(rotate?.args[0]).toBeCloseTo(Math.PI / 2, 5);
  });

  it("applies horizontal flip without swapping dimensions", async () => {
    const { contextCalls, getCanvasDims } = setupCanvasMock(
      1000,
      600,
      { flipHorizontal: true },
    );

    const result = await composeFullTransformedImage({
      previewUrl: "blob:source",
      sourceFile: new File(["source"], "photo.jpg", { type: "image/jpeg" }),
      previewTransform: { rotation: 0, flipHorizontal: true, flipVertical: false },
    });

    expect(result.width).toBe(1000);
    expect(result.height).toBe(600);
    expect(getCanvasDims()).toEqual({ width: 1000, height: 600 });

    const scales = contextCalls.filter((c) => c.method === "scale");
    expect(scales).toHaveLength(1);
    expect(scales[0]?.args).toEqual([-1, 1]);
    // Horizontal flip has no rotation (0 radians).
    const rotate = contextCalls.find((c) => c.method === "rotate");
    expect(rotate?.args[0]).toBe(0);
  });

  it("falls back to png for unsupported source mime type", async () => {
    setupCanvasMock(1000, 600, null);

    const result = await composeFullTransformedImage({
      previewUrl: "blob:source",
      sourceFile: new File(["source"], "photo.bmp", { type: "image/bmp" }),
      previewTransform: { rotation: 0, flipHorizontal: false, flipVertical: false },
    });

    expect(result.file.type).toBe("image/png");
    expect(result.file.name).toBe("photo-transformed.png");
  });
});
