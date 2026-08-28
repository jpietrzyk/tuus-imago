import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  drawCroppedImageToCanvas,
  loadImageElement,
  resolveImageDimensions,
} from "./preview-canvas-utils";
import type { CropCalculationResult } from "./image-proportion-calculator";

const createCrop = (): CropCalculationResult => ({
  cropX: 10,
  cropY: 20,
  cropWidth: 100,
  cropHeight: 80,
  outputWidth: 100,
  outputHeight: 80,
  sourceArea: 96000,
  cropArea: 8000,
  coverageRatio: 0.0833,
  coveragePercent: 8.33,
  widthScale: 0.5,
  heightScale: 0.4,
});

describe("preview-canvas-utils", () => {
  beforeEach(() => {
    Object.defineProperty(window, "devicePixelRatio", {
      value: 1,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("loads image element from preview URL", async () => {
    const mockImage = class {
      naturalWidth = 320;
      naturalHeight = 240;
      width = 320;
      height = 240;

      decode() {
        return Promise.resolve();
      }

      set src(_value: string) {}
    };

    vi.stubGlobal("Image", mockImage);

    const image = await loadImageElement("blob:test-preview");

    expect(image.naturalWidth).toBe(320);
    expect(image.naturalHeight).toBe(240);
  });

  it("resolves source dimensions using natural values", () => {
    const image = {
      naturalWidth: 1200,
      naturalHeight: 800,
      width: 600,
      height: 400,
    } as HTMLImageElement;

    expect(resolveImageDimensions(image)).toEqual({
      sourceWidth: 1200,
      sourceHeight: 800,
    });
  });

  it("draws crop into canvas using crop output fallback when canvas is not measured", () => {
    const canvas = document.createElement("canvas");
    const clearRect = vi.fn();
    const drawImage = vi.fn();

    vi.spyOn(canvas, "getContext").mockReturnValue({
      clearRect,
      drawImage,
    } as unknown as CanvasRenderingContext2D);

    vi.spyOn(canvas, "getBoundingClientRect").mockReturnValue({
      width: 0,
      height: 0,
      x: 0,
      y: 0,
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      toJSON: () => ({}),
    });

    const image = document.createElement("img");
    const crop = createCrop();

    const drawn = drawCroppedImageToCanvas({
      canvas,
      image,
      crop,
    });

    expect(drawn).toBe(true);
    expect(canvas.width).toBe(crop.outputWidth);
    expect(canvas.height).toBe(crop.outputHeight);
    expect(clearRect).toHaveBeenCalledWith(0, 0, crop.outputWidth, crop.outputHeight);
    expect(drawImage).toHaveBeenCalledWith(
      image,
      crop.cropX,
      crop.cropY,
      crop.cropWidth,
      crop.cropHeight,
      0,
      0,
      crop.outputWidth,
      crop.outputHeight,
    );
  });

  it("falls back when measured canvas size is transiently tiny and keeps display size CSS-driven", () => {
    const canvas = document.createElement("canvas");
    const clearRect = vi.fn();
    const drawImage = vi.fn();

    Object.defineProperty(window, "devicePixelRatio", {
      value: 2,
      configurable: true,
    });

    vi.spyOn(canvas, "getContext").mockReturnValue({
      clearRect,
      drawImage,
    } as unknown as CanvasRenderingContext2D);

    vi.spyOn(canvas, "getBoundingClientRect").mockReturnValue({
      width: 12,
      height: 10,
      x: 0,
      y: 0,
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      toJSON: () => ({}),
    });

    const image = document.createElement("img");
    const crop = createCrop();

    const drawn = drawCroppedImageToCanvas({
      canvas,
      image,
      crop,
    });

    expect(drawn).toBe(true);
    // Uses crop output buffer size because tiny measured rect is considered unstable.
    expect(canvas.width).toBe(crop.outputWidth * 2);
    expect(canvas.height).toBe(crop.outputHeight * 2);
    expect(canvas.style.width).toBe("");
    expect(canvas.style.height).toBe("");
    expect(clearRect).toHaveBeenCalledWith(
      0,
      0,
      crop.outputWidth * 2,
      crop.outputHeight * 2,
    );
    expect(drawImage).toHaveBeenCalledWith(
      image,
      crop.cropX,
      crop.cropY,
      crop.cropWidth,
      crop.cropHeight,
      0,
      0,
      crop.outputWidth * 2,
      crop.outputHeight * 2,
    );
  });

  it("returns false when canvas context is unavailable", () => {
    const canvas = document.createElement("canvas");
    vi.spyOn(canvas, "getContext").mockReturnValue(null);

    const image = document.createElement("img");
    const crop = createCrop();

    expect(
      drawCroppedImageToCanvas({
        canvas,
        image,
        crop,
      }),
    ).toBe(false);
  });

  it("preserves crop aspect ratio when measured canvas box has mismatched ratio", () => {
    const canvas = document.createElement("canvas");
    const clearRect = vi.fn();
    const drawImage = vi.fn();

    vi.spyOn(canvas, "getContext").mockReturnValue({
      clearRect,
      drawImage,
    } as unknown as CanvasRenderingContext2D);

    vi.spyOn(canvas, "getBoundingClientRect").mockReturnValue({
      width: 800,
      height: 450,
      x: 0,
      y: 0,
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      toJSON: () => ({}),
    });

    const image = document.createElement("img");
    const crop = {
      ...createCrop(),
      outputWidth: 720,
      outputHeight: 1080,
      cropWidth: 720,
      cropHeight: 1080,
    };

    const drawn = drawCroppedImageToCanvas({
      canvas,
      image,
      crop,
    });

    expect(drawn).toBe(true);
    expect(canvas.width).toBe(800);
    expect(canvas.height).toBe(450);
    expect(drawImage).toHaveBeenCalledWith(
      image,
      crop.cropX,
      crop.cropY,
      crop.cropWidth,
      crop.cropHeight,
      250,
      0,
      300,
      450,
    );
  });

  it("centers square crop inside a wide measured canvas without stretching", () => {
    const canvas = document.createElement("canvas");
    const clearRect = vi.fn();
    const drawImage = vi.fn();

    vi.spyOn(canvas, "getContext").mockReturnValue({
      clearRect,
      drawImage,
    } as unknown as CanvasRenderingContext2D);

    vi.spyOn(canvas, "getBoundingClientRect").mockReturnValue({
      width: 1000,
      height: 500,
      x: 0,
      y: 0,
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      toJSON: () => ({}),
    });

    const image = document.createElement("img");
    const crop = {
      ...createCrop(),
      outputWidth: 1080,
      outputHeight: 1080,
      cropWidth: 1080,
      cropHeight: 1080,
    };

    const drawn = drawCroppedImageToCanvas({
      canvas,
      image,
      crop,
    });

    expect(drawn).toBe(true);
    expect(drawImage).toHaveBeenCalledWith(
      image,
      crop.cropX,
      crop.cropY,
      crop.cropWidth,
      crop.cropHeight,
      250,
      0,
      500,
      500,
    );
  });

  describe("effects filters", () => {
    const createEffectsContext = () => ({
      filter: "none",
      clearRect: vi.fn(),
      drawImage: vi.fn(),
    });

    const mountEffectsCanvas = (
      context: ReturnType<typeof createEffectsContext>,
    ) => {
      const canvas = document.createElement("canvas");
      vi.spyOn(canvas, "getContext").mockReturnValue(
        context as unknown as CanvasRenderingContext2D,
      );
      vi.spyOn(canvas, "getBoundingClientRect").mockReturnValue({
        width: 600,
        height: 400,
        x: 0,
        y: 0,
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        toJSON: () => ({}),
      });
      return canvas;
    };

    it("applies grayscale filter from grayscale effect", () => {
      const context = createEffectsContext();
      const canvas = mountEffectsCanvas(context);
      const image = document.createElement("img");
      const crop = createCrop();

      drawCroppedImageToCanvas({
        canvas,
        image,
        crop,
        effects: { brightness: 0, contrast: 0, grayscale: 50 },
      });

      expect(context.filter).toBe("grayscale(0.5)");
    });

    it("combines brightness, contrast and grayscale filters", () => {
      const context = createEffectsContext();
      const canvas = mountEffectsCanvas(context);
      const image = document.createElement("img");
      const crop = createCrop();

      drawCroppedImageToCanvas({
        canvas,
        image,
        crop,
        effects: { brightness: 20, contrast: -30, grayscale: 100 },
      });

      expect(context.filter).toBe("brightness(1.2) contrast(0.7) grayscale(1)");
    });

    it("keeps filter none when all effects are neutral", () => {
      const context = createEffectsContext();
      const canvas = mountEffectsCanvas(context);
      const image = document.createElement("img");
      const crop = createCrop();

      drawCroppedImageToCanvas({
        canvas,
        image,
        crop,
        effects: { brightness: 0, contrast: 0, grayscale: 0 },
      });

      expect(context.filter).toBe("none");
    });
  });

  describe("transform (rotation / flip)", () => {
    const createTransformContext = () => ({
      filter: "none",
      clearRect: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      rotate: vi.fn(),
      scale: vi.fn(),
      drawImage: vi.fn(),
    });

    const mountCanvas = (
      context: ReturnType<typeof createTransformContext>,
      width = 600,
      height = 400,
    ) => {
      const canvas = document.createElement("canvas");
      vi.spyOn(canvas, "getContext").mockReturnValue(
        context as unknown as CanvasRenderingContext2D,
      );
      vi.spyOn(canvas, "getBoundingClientRect").mockReturnValue({
        width,
        height,
        x: 0,
        y: 0,
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        toJSON: () => ({}),
      });
      return canvas;
    };

    it("applies horizontal flip via context transforms", () => {
      const context = createTransformContext();
      const canvas = mountCanvas(context);
      const image = document.createElement("img");
      const crop = createCrop(); // aspect 100/80 = 1.25

      const drawn = drawCroppedImageToCanvas({
        canvas,
        image,
        crop,
        transform: { rotation: 0, flipHorizontal: true, flipVertical: false },
      });

      expect(drawn).toBe(true);
      // 600x400 canvas, aspect 1.5 > crop aspect 1.25 → drawWidth = 400*1.25 = 500
      expect(context.translate).toHaveBeenCalledWith(300, 200);
      expect(context.scale).toHaveBeenCalledWith(-1, 1);
      expect(context.save).toHaveBeenCalledTimes(1);
      expect(context.restore).toHaveBeenCalledTimes(1);
      expect(context.drawImage).toHaveBeenCalledWith(
        image,
        crop.cropX,
        crop.cropY,
        crop.cropWidth,
        crop.cropHeight,
        -250,
        -200,
        500,
        400,
      );
    });

    it("applies vertical flip via context transforms", () => {
      const context = createTransformContext();
      const canvas = mountCanvas(context);
      const image = document.createElement("img");
      const crop = createCrop();

      drawCroppedImageToCanvas({
        canvas,
        image,
        crop,
        transform: { rotation: 0, flipHorizontal: false, flipVertical: true },
      });

      expect(context.scale).toHaveBeenCalledWith(1, -1);
    });

    it("rotates 180 degrees", () => {
      const context = createTransformContext();
      const canvas = mountCanvas(context);
      const image = document.createElement("img");
      const crop = createCrop();

      drawCroppedImageToCanvas({
        canvas,
        image,
        crop,
        transform: { rotation: 180, flipHorizontal: false, flipVertical: false },
      });

      expect(context.rotate).toHaveBeenCalledWith(Math.PI);
      expect(context.drawImage).toHaveBeenCalledWith(
        image,
        crop.cropX,
        crop.cropY,
        crop.cropWidth,
        crop.cropHeight,
        -250,
        -200,
        500,
        400,
      );
    });

    it("rotates 90 degrees with swapped destination box", () => {
      const context = createTransformContext();
      const canvas = mountCanvas(context);
      const image = document.createElement("img");
      const crop = createCrop(); // aspect 1.25 → displayed aspect 0.8 after 90°

      drawCroppedImageToCanvas({
        canvas,
        image,
        crop,
        transform: { rotation: 90, flipHorizontal: false, flipVertical: false },
      });

      expect(context.rotate).toHaveBeenCalledWith(Math.PI / 2);
      // drawWidth = 400 * 0.8 = 320; rect dims swapped → 400 x 320
      expect(context.drawImage).toHaveBeenCalledWith(
        image,
        crop.cropX,
        crop.cropY,
        crop.cropWidth,
        crop.cropHeight,
        -200,
        -160,
        400,
        320,
      );
    });

    it("rotates 270 degrees with swapped destination box", () => {
      const context = createTransformContext();
      const canvas = mountCanvas(context);
      const image = document.createElement("img");
      const crop = createCrop();

      drawCroppedImageToCanvas({
        canvas,
        image,
        crop,
        transform: { rotation: 270, flipHorizontal: false, flipVertical: false },
      });

      expect(context.rotate).toHaveBeenCalledWith((270 * Math.PI) / 180);
      expect(context.drawImage).toHaveBeenCalledWith(
        image,
        crop.cropX,
        crop.cropY,
        crop.cropWidth,
        crop.cropHeight,
        -200,
        -160,
        400,
        320,
      );
    });

    it("normalizes rotation values beyond a full turn", () => {
      const context = createTransformContext();
      const canvas = mountCanvas(context);
      const image = document.createElement("img");
      const crop = createCrop();

      drawCroppedImageToCanvas({
        canvas,
        image,
        crop,
        transform: { rotation: 450, flipHorizontal: false, flipVertical: false },
      });

      // 450° → 90°
      expect(context.rotate).toHaveBeenCalledWith(Math.PI / 2);
    });

    it("treats a 360° rotation with no flips as identity (untransformed path)", () => {
      const context = createTransformContext();
      const canvas = mountCanvas(context);
      const image = document.createElement("img");
      const crop = createCrop();

      drawCroppedImageToCanvas({
        canvas,
        image,
        crop,
        transform: { rotation: 360, flipHorizontal: false, flipVertical: false },
      });

      expect(context.save).not.toHaveBeenCalled();
      expect(context.translate).not.toHaveBeenCalled();
      expect(context.rotate).not.toHaveBeenCalled();
      // Identity path centers the draw at positive offsets.
      expect(context.drawImage).toHaveBeenCalledWith(
        image,
        crop.cropX,
        crop.cropY,
        crop.cropWidth,
        crop.cropHeight,
        50,
        0,
        500,
        400,
      );
    });
  });
});
