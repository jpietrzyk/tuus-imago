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
});
