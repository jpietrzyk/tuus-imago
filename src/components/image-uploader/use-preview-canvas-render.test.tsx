import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { useEffect, useRef, useState, useCallback } from "react";
import { usePreviewCanvasRender } from "./use-preview-canvas-render";
import * as previewCanvasUtils from "./preview-canvas-utils";
import * as previewRenderPlan from "./preview-render-plan";
import type { ImageDisplayProportion } from "./image-proportion-calculator";
import type { SelectedImageMetadata } from "./image-uploader";
import type { CropAdjust } from "./use-crop-adjust";

vi.mock("./preview-canvas-utils", () => ({
  loadImageElement: vi.fn(),
  resolveImageDimensions: vi.fn(),
  drawCroppedImageToCanvas: vi.fn(),
}));

vi.mock("./preview-render-plan", () => ({
  buildPreviewRenderPlan: vi.fn(),
}));

interface HarnessProps {
  previewUrl: string | null;
  onMetadataResolved: (args: {
    metadata: SelectedImageMetadata;
    nextDisplayImageProportion: ImageDisplayProportion;
    shouldAutoSelectOptimalProportion: boolean;
  }) => void;
  selectedImageMetadata: SelectedImageMetadata | null;
  bestProportion: ImageDisplayProportion | null;
  userSelectedProportion: ImageDisplayProportion;
  previewEffects: { brightness: number; contrast: number } | null;
  previewCropAdjust?: CropAdjust;
}

function Harness({
  previewUrl,
  onMetadataResolved,
  selectedImageMetadata,
  bestProportion,
  userSelectedProportion,
  previewEffects,
  previewCropAdjust,
}: HarnessProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const latestRenderConfigRef = useRef<{
    selectedImageMetadata: SelectedImageMetadata | null;
    bestProportion: ImageDisplayProportion | null;
    userSelectedProportion: ImageDisplayProportion;
    previewEffects: { brightness: number; contrast: number } | null;
    previewCropAdjust?: CropAdjust;
  }>({
    selectedImageMetadata,
    bestProportion,
    userSelectedProportion,
    previewEffects: previewEffects ?? null,
    previewCropAdjust,
  });

  useEffect(() => {
    latestRenderConfigRef.current = {
      selectedImageMetadata,
      bestProportion,
      userSelectedProportion,
      previewEffects: previewEffects ?? null,
      previewCropAdjust,
    };
  }, [
    bestProportion,
    selectedImageMetadata,
    userSelectedProportion,
    previewEffects,
    previewCropAdjust,
  ]);

  usePreviewCanvasRender({
    previewUrl,
    canvasRef,
    selectedImageMetadata,
    bestProportion,
    userSelectedProportion,
    latestRenderConfigRef,
    onMetadataResolved,
    previewEffects: previewEffects ?? null,
    previewCropAdjust,
  });

  return <canvas ref={canvasRef} data-testid="canvas" />;
}

describe("usePreviewCanvasRender", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads image, builds render plan, emits metadata and draws to canvas", async () => {
    const onMetadataResolved = vi.fn();
    const image = document.createElement("img");

    vi.mocked(previewCanvasUtils.loadImageElement).mockResolvedValue(image);
    vi.mocked(previewCanvasUtils.resolveImageDimensions).mockReturnValue({
      sourceWidth: 1200,
      sourceHeight: 800,
    });
    vi.mocked(previewRenderPlan.buildPreviewRenderPlan).mockReturnValue({
      metadata: {
        width: 1200,
        height: 800,
        aspectRatio: "3:2",
      },
      nextDisplayImageProportion: "horizontal",
      shouldAutoSelectOptimalProportion: false,
      crop: {
        cropX: 0,
        cropY: 0,
        cropWidth: 1200,
        cropHeight: 675,
        outputWidth: 1200,
        outputHeight: 675,
        sourceArea: 960000,
        cropArea: 810000,
        coverageRatio: 0.84375,
        coveragePercent: 84.38,
        widthScale: 1,
        heightScale: 0.84375,
      },
    });

    render(
      <Harness
        previewUrl="blob:preview"
        onMetadataResolved={onMetadataResolved}
        selectedImageMetadata={null}
        bestProportion={null}
        userSelectedProportion="horizontal"
        previewEffects={null}
      />,
    );

    await waitFor(() => {
      expect(previewCanvasUtils.loadImageElement).toHaveBeenCalledWith(
        "blob:preview",
      );
    });

    expect(previewRenderPlan.buildPreviewRenderPlan).toHaveBeenCalledWith({
      sourceWidth: 1200,
      sourceHeight: 800,
      selectedImageMetadata: null,
      allowAutoSelectOptimalProportion: true,
      bestProportion: null,
      userSelectedProportion: "horizontal",
    });
    expect(onMetadataResolved).toHaveBeenCalledWith({
      metadata: {
        width: 1200,
        height: 800,
        aspectRatio: "3:2",
      },
      nextDisplayImageProportion: "horizontal",
      shouldAutoSelectOptimalProportion: false,
    });
    expect(previewCanvasUtils.drawCroppedImageToCanvas).toHaveBeenCalledTimes(
      1,
    );
  });

  it("does not continue render pipeline when dimensions are invalid", async () => {
    const onMetadataResolved = vi.fn();
    const image = document.createElement("img");

    vi.mocked(previewCanvasUtils.loadImageElement).mockResolvedValue(image);
    vi.mocked(previewCanvasUtils.resolveImageDimensions).mockReturnValue({
      sourceWidth: 0,
      sourceHeight: 800,
    });

    render(
      <Harness
        previewUrl="blob:preview"
        onMetadataResolved={onMetadataResolved}
        selectedImageMetadata={null}
        bestProportion={null}
        userSelectedProportion="horizontal"
        previewEffects={null}
      />,
    );

    await waitFor(() => {
      expect(previewCanvasUtils.loadImageElement).toHaveBeenCalledTimes(1);
    });

    expect(previewRenderPlan.buildPreviewRenderPlan).not.toHaveBeenCalled();
    expect(onMetadataResolved).not.toHaveBeenCalled();
    expect(previewCanvasUtils.drawCroppedImageToCanvas).not.toHaveBeenCalled();
  });

  it("cancels pipeline when effect is cleaned up before image resolves", async () => {
    const onMetadataResolved = vi.fn();
    const image = document.createElement("img");

    let resolveLoad: (img: HTMLImageElement) => void = () => {};
    const deferred = new Promise<HTMLImageElement>((resolve) => {
      resolveLoad = resolve;
    });

    vi.mocked(previewCanvasUtils.loadImageElement).mockReturnValue(deferred);
    vi.mocked(previewCanvasUtils.resolveImageDimensions).mockReturnValue({
      sourceWidth: 1200,
      sourceHeight: 800,
    });

    const { rerender } = render(
      <Harness
        previewUrl="blob:preview"
        onMetadataResolved={onMetadataResolved}
        selectedImageMetadata={null}
        bestProportion={null}
        userSelectedProportion="horizontal"
        previewEffects={null}
      />,
    );

    rerender(
      <Harness
        previewUrl={null}
        onMetadataResolved={onMetadataResolved}
        selectedImageMetadata={null}
        bestProportion={null}
        userSelectedProportion="horizontal"
        previewEffects={null}
      />,
    );

    resolveLoad(image);

    await waitFor(() => {
      expect(previewCanvasUtils.loadImageElement).toHaveBeenCalledTimes(1);
    });

    expect(previewRenderPlan.buildPreviewRenderPlan).not.toHaveBeenCalled();
    expect(onMetadataResolved).not.toHaveBeenCalled();
    expect(previewCanvasUtils.drawCroppedImageToCanvas).not.toHaveBeenCalled();
  });

  it("reruns render pipeline when proportion changes even with stable callback", async () => {
    const onMetadataResolved = vi.fn();
    const image = document.createElement("img");

    vi.mocked(previewCanvasUtils.loadImageElement).mockResolvedValue(image);
    vi.mocked(previewCanvasUtils.resolveImageDimensions).mockReturnValue({
      sourceWidth: 1200,
      sourceHeight: 800,
    });
    vi.mocked(previewRenderPlan.buildPreviewRenderPlan).mockImplementation(
      ({ userSelectedProportion }) => ({
        metadata: {
          width: 1200,
          height: 800,
          aspectRatio: "3:2",
        },
        nextDisplayImageProportion: userSelectedProportion,
        shouldAutoSelectOptimalProportion: false,
        crop: {
          cropX: 0,
          cropY: 0,
          cropWidth: 1200,
          cropHeight: userSelectedProportion === "vertical" ? 1800 : 675,
          outputWidth: userSelectedProportion === "vertical" ? 533 : 1200,
          outputHeight: userSelectedProportion === "vertical" ? 800 : 675,
          sourceArea: 960000,
          cropArea: 810000,
          coverageRatio: 0.84375,
          coveragePercent: 84.38,
          widthScale: 1,
          heightScale: 0.84375,
        },
      }),
    );

    const { rerender } = render(
      <Harness
        previewUrl="blob:preview"
        onMetadataResolved={onMetadataResolved}
        selectedImageMetadata={{
          width: 1200,
          height: 800,
          aspectRatio: "3:2",
        }}
        bestProportion="horizontal"
        userSelectedProportion="horizontal"
        previewEffects={null}
      />,
    );

    await waitFor(() => {
      expect(previewCanvasUtils.loadImageElement).toHaveBeenCalledTimes(1);
    });

    rerender(
      <Harness
        previewUrl="blob:preview"
        onMetadataResolved={onMetadataResolved}
        selectedImageMetadata={{
          width: 1200,
          height: 800,
          aspectRatio: "3:2",
        }}
        bestProportion="horizontal"
        userSelectedProportion="vertical"
        previewEffects={null}
      />,
    );

    await waitFor(() => {
      expect(previewRenderPlan.buildPreviewRenderPlan).toHaveBeenCalledTimes(2);
    });

    expect(previewCanvasUtils.loadImageElement).toHaveBeenCalledTimes(1);

    expect(previewRenderPlan.buildPreviewRenderPlan).toHaveBeenNthCalledWith(
      2,
      {
        sourceWidth: 1200,
        sourceHeight: 800,
        selectedImageMetadata: {
          width: 1200,
          height: 800,
          aspectRatio: "3:2",
        },
        allowAutoSelectOptimalProportion: true,
        bestProportion: "horizontal",
        userSelectedProportion: "vertical",
      },
    );
  });

  it("does not create feedback loop when metadata is stored in state and passed back", async () => {
    const image = document.createElement("img");

    vi.mocked(previewCanvasUtils.loadImageElement).mockResolvedValue(image);
    vi.mocked(previewCanvasUtils.resolveImageDimensions).mockReturnValue({
      sourceWidth: 1200,
      sourceHeight: 800,
    });
    vi.mocked(previewRenderPlan.buildPreviewRenderPlan).mockImplementation(
      () => ({
        metadata: {
          width: 1200,
          height: 800,
          aspectRatio: "3:2",
        },
        nextDisplayImageProportion: "horizontal",
        shouldAutoSelectOptimalProportion: false,
        crop: {
          cropX: 0,
          cropY: 0,
          cropWidth: 1200,
          cropHeight: 675,
          outputWidth: 1200,
          outputHeight: 675,
          sourceArea: 960000,
          cropArea: 810000,
          coverageRatio: 0.84375,
          coveragePercent: 84.38,
          widthScale: 1,
          heightScale: 0.84375,
        },
      }),
    );

    interface StatefulHarnessProps {
      previewUrl: string | null;
    }

    function StatefulHarness({ previewUrl }: StatefulHarnessProps) {
      const [storedMetadata, setStoredMetadata] =
        useState<SelectedImageMetadata | null>(null);
      const canvasRef = useRef<HTMLCanvasElement>(null);
      const latestRenderConfigRef = useRef({
        selectedImageMetadata: storedMetadata,
        bestProportion: null as ImageDisplayProportion | null,
        userSelectedProportion: "horizontal" as ImageDisplayProportion,
        previewEffects: null as { brightness: number; contrast: number } | null,
      });

      useEffect(() => {
        latestRenderConfigRef.current = {
          selectedImageMetadata: storedMetadata,
          bestProportion: null,
          userSelectedProportion: "horizontal",
          previewEffects: null,
        };
      }, [storedMetadata]);

      const handleMetadataResolved = useCallback(
        (args: {
          metadata: SelectedImageMetadata;
          nextDisplayImageProportion: ImageDisplayProportion;
          shouldAutoSelectOptimalProportion: boolean;
        }) => {
          setStoredMetadata(args.metadata);
        },
        [],
      );

      usePreviewCanvasRender({
        previewUrl,
        canvasRef,
        selectedImageMetadata: storedMetadata,
        bestProportion: null,
        userSelectedProportion: "horizontal",
        latestRenderConfigRef,
        onMetadataResolved: handleMetadataResolved,
        previewEffects: null,
      });

      return <canvas ref={canvasRef} data-testid="canvas" />;
    }

    render(<StatefulHarness previewUrl="blob:preview" />);

    await waitFor(() => {
      expect(previewCanvasUtils.loadImageElement).toHaveBeenCalledTimes(1);
    });

    expect(previewRenderPlan.buildPreviewRenderPlan).toHaveBeenCalledTimes(1);
    // Should only draw once, not repeatedly in a feedback loop
    expect(previewCanvasUtils.drawCroppedImageToCanvas).toHaveBeenCalledTimes(
      1,
    );
  });

  it("redraws preview canvas on viewport resize", async () => {
    const onMetadataResolved = vi.fn();
    const image = document.createElement("img");

    vi.mocked(previewCanvasUtils.loadImageElement).mockResolvedValue(image);
    vi.mocked(previewCanvasUtils.resolveImageDimensions).mockReturnValue({
      sourceWidth: 1200,
      sourceHeight: 800,
    });
    vi.mocked(previewRenderPlan.buildPreviewRenderPlan).mockReturnValue({
      metadata: {
        width: 1200,
        height: 800,
        aspectRatio: "3:2",
      },
      nextDisplayImageProportion: "horizontal",
      shouldAutoSelectOptimalProportion: false,
      crop: {
        cropX: 0,
        cropY: 0,
        cropWidth: 1200,
        cropHeight: 675,
        outputWidth: 1200,
        outputHeight: 675,
        sourceArea: 960000,
        cropArea: 810000,
        coverageRatio: 0.84375,
        coveragePercent: 84.38,
        widthScale: 1,
        heightScale: 0.84375,
      },
    });

    render(
      <Harness
        previewUrl="blob:preview"
        onMetadataResolved={onMetadataResolved}
        selectedImageMetadata={null}
        bestProportion={null}
        userSelectedProportion="horizontal"
        previewEffects={null}
      />,
    );

    await waitFor(() => {
      expect(previewCanvasUtils.drawCroppedImageToCanvas).toHaveBeenCalledTimes(
        1,
      );
    });

    window.dispatchEvent(new Event("resize"));

    await waitFor(() => {
      expect(previewCanvasUtils.drawCroppedImageToCanvas).toHaveBeenCalledTimes(
        2,
      );
    });

    expect(previewCanvasUtils.loadImageElement).toHaveBeenCalledTimes(1);
  });

  it("redraws preview canvas when canvas element resizes (e.g. debug panel toggle)", async () => {
    const onMetadataResolved = vi.fn();
    const image = document.createElement("img");
    let capturedResizeCallback: unknown = null;

    vi.stubGlobal(
      "ResizeObserver",
      class {
        constructor(callback: ResizeObserverCallback) {
          capturedResizeCallback = callback;
        }
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );

    vi.mocked(previewCanvasUtils.loadImageElement).mockResolvedValue(image);
    vi.mocked(previewCanvasUtils.resolveImageDimensions).mockReturnValue({
      sourceWidth: 1200,
      sourceHeight: 800,
    });
    vi.mocked(previewRenderPlan.buildPreviewRenderPlan).mockReturnValue({
      metadata: { width: 1200, height: 800, aspectRatio: "3:2" },
      nextDisplayImageProportion: "horizontal",
      shouldAutoSelectOptimalProportion: false,
      crop: {
        cropX: 0,
        cropY: 0,
        cropWidth: 1200,
        cropHeight: 675,
        outputWidth: 1200,
        outputHeight: 675,
        sourceArea: 960000,
        cropArea: 810000,
        coverageRatio: 0.84375,
        coveragePercent: 84.38,
        widthScale: 1,
        heightScale: 0.84375,
      },
    });

    render(
      <Harness
        previewUrl="blob:preview"
        onMetadataResolved={onMetadataResolved}
        selectedImageMetadata={null}
        bestProportion={null}
        userSelectedProportion="horizontal"
        previewEffects={null}
      />,
    );

    await waitFor(() => {
      expect(previewCanvasUtils.drawCroppedImageToCanvas).toHaveBeenCalledTimes(
        1,
      );
    });

    // Simulate a layout-driven canvas resize (e.g. debug panel appearing/disappearing).
    if (typeof capturedResizeCallback !== "function") {
      throw new Error("ResizeObserver callback was not captured");
    }
    capturedResizeCallback([], null);

    await waitFor(() => {
      expect(previewCanvasUtils.drawCroppedImageToCanvas).toHaveBeenCalledTimes(
        2,
      );
    });

    // Image should not be reloaded — only redrawn.
    expect(previewCanvasUtils.loadImageElement).toHaveBeenCalledTimes(1);
  });

  it("stores previewEffects in latestRenderConfigRef when provided", async () => {
    const onMetadataResolved = vi.fn();
    const image = document.createElement("img");

    vi.mocked(previewCanvasUtils.loadImageElement).mockResolvedValue(image);
    vi.mocked(previewCanvasUtils.resolveImageDimensions).mockReturnValue({
      sourceWidth: 1200,
      sourceHeight: 800,
    });
    vi.mocked(previewRenderPlan.buildPreviewRenderPlan).mockReturnValue({
      metadata: {
        width: 1200,
        height: 800,
        aspectRatio: "3:2",
      },
      nextDisplayImageProportion: "horizontal",
      shouldAutoSelectOptimalProportion: false,
      crop: {
        cropX: 0,
        cropY: 0,
        cropWidth: 1200,
        cropHeight: 675,
        outputWidth: 1200,
        outputHeight: 675,
        sourceArea: 960000,
        cropArea: 810000,
        coverageRatio: 0.84375,
        coveragePercent: 84.38,
        widthScale: 1,
        heightScale: 0.84375,
      },
    });

    const effects = { brightness: 50, contrast: -30 };

    render(
      <Harness
        previewUrl="blob:preview"
        onMetadataResolved={onMetadataResolved}
        selectedImageMetadata={null}
        bestProportion={null}
        userSelectedProportion="horizontal"
        previewEffects={effects}
      />,
    );

    await waitFor(() => {
      expect(previewCanvasUtils.drawCroppedImageToCanvas).toHaveBeenCalledTimes(
        1,
      );
    });

    // Verify effects were passed to drawCroppedImageToCanvas
    expect(previewCanvasUtils.drawCroppedImageToCanvas).toHaveBeenCalledWith(
      expect.objectContaining({
        effects: { brightness: 50, contrast: -30 },
      }),
    );
  });

  it("passes previewEffects parameter to drawCroppedImageToCanvas when effects exist", async () => {
    const onMetadataResolved = vi.fn();
    const image = document.createElement("img");

    vi.mocked(previewCanvasUtils.loadImageElement).mockResolvedValue(image);
    vi.mocked(previewCanvasUtils.resolveImageDimensions).mockReturnValue({
      sourceWidth: 1200,
      sourceHeight: 800,
    });
    vi.mocked(previewRenderPlan.buildPreviewRenderPlan).mockReturnValue({
      metadata: {
        width: 1200,
        height: 800,
        aspectRatio: "3:2",
      },
      nextDisplayImageProportion: "horizontal",
      shouldAutoSelectOptimalProportion: false,
      crop: {
        cropX: 0,
        cropY: 0,
        cropWidth: 1200,
        cropHeight: 675,
        outputWidth: 1200,
        outputHeight: 675,
        sourceArea: 960000,
        cropArea: 810000,
        coverageRatio: 0.84375,
        coveragePercent: 84.38,
        widthScale: 1,
        heightScale: 0.84375,
      },
    });

    render(
      <Harness
        previewUrl="blob:preview"
        onMetadataResolved={onMetadataResolved}
        selectedImageMetadata={null}
        bestProportion={null}
        userSelectedProportion="horizontal"
        previewEffects={{ brightness: 25, contrast: 10 }}
      />,
    );

    await waitFor(() => {
      expect(previewCanvasUtils.drawCroppedImageToCanvas).toHaveBeenCalled();
    });

    // Last call should include effects parameter
    expect(
      vi.mocked(previewCanvasUtils.drawCroppedImageToCanvas),
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        effects: { brightness: 25, contrast: 10 },
      }),
    );
  });

  it("rerenders when previewEffects change", async () => {
    const onMetadataResolved = vi.fn();
    const image = document.createElement("img");

    vi.mocked(previewCanvasUtils.loadImageElement).mockResolvedValue(image);
    vi.mocked(previewCanvasUtils.resolveImageDimensions).mockReturnValue({
      sourceWidth: 1200,
      sourceHeight: 800,
    });
    vi.mocked(previewRenderPlan.buildPreviewRenderPlan).mockReturnValue({
      metadata: {
        width: 1200,
        height: 800,
        aspectRatio: "3:2",
      },
      nextDisplayImageProportion: "horizontal",
      shouldAutoSelectOptimalProportion: false,
      crop: {
        cropX: 0,
        cropY: 0,
        cropWidth: 1200,
        cropHeight: 675,
        outputWidth: 1200,
        outputHeight: 675,
        sourceArea: 960000,
        cropArea: 810000,
        coverageRatio: 0.84375,
        coveragePercent: 84.38,
        widthScale: 1,
        heightScale: 0.84375,
      },
    });

    const { rerender } = render(
      <Harness
        previewUrl="blob:preview"
        onMetadataResolved={onMetadataResolved}
        selectedImageMetadata={{
          width: 1200,
          height: 800,
          aspectRatio: "3:2",
        }}
        bestProportion="horizontal"
        userSelectedProportion="horizontal"
        previewEffects={{ brightness: 0, contrast: 0 }}
      />,
    );

    await waitFor(() => {
      expect(previewCanvasUtils.drawCroppedImageToCanvas).toHaveBeenCalledTimes(
        1,
      );
    });

    // Change effects
    rerender(
      <Harness
        previewUrl="blob:preview"
        onMetadataResolved={onMetadataResolved}
        selectedImageMetadata={{
          width: 1200,
          height: 800,
          aspectRatio: "3:2",
        }}
        bestProportion="horizontal"
        userSelectedProportion="horizontal"
        previewEffects={{ brightness: 50, contrast: 20 }}
      />,
    );

    // Should trigger another render with new effects
    await waitFor(() => {
      expect(previewCanvasUtils.drawCroppedImageToCanvas).toHaveBeenCalledTimes(
        2,
      );
    });

    expect(
      vi.mocked(previewCanvasUtils.drawCroppedImageToCanvas),
    ).toHaveBeenLastCalledWith(
      expect.objectContaining({
        effects: { brightness: 50, contrast: 20 },
      }),
    );
  });

  it("redraws canvas when previewCropAdjust changes without reloading image", async () => {
    const onMetadataResolved = vi.fn();
    const image = document.createElement("img");

    vi.mocked(previewCanvasUtils.loadImageElement).mockResolvedValue(image);
    vi.mocked(previewCanvasUtils.resolveImageDimensions).mockReturnValue({
      sourceWidth: 1200,
      sourceHeight: 800,
    });
    vi.mocked(previewRenderPlan.buildPreviewRenderPlan).mockReturnValue({
      metadata: { width: 1200, height: 800, aspectRatio: "3:2" },
      nextDisplayImageProportion: "horizontal",
      shouldAutoSelectOptimalProportion: false,
      crop: {
        cropX: 0,
        cropY: 0,
        cropWidth: 1200,
        cropHeight: 675,
        outputWidth: 1200,
        outputHeight: 675,
        sourceArea: 960000,
        cropArea: 810000,
        coverageRatio: 0.84375,
        coveragePercent: 84.38,
        widthScale: 1,
        heightScale: 0.84375,
      },
    });

    const { rerender } = render(
      <Harness
        previewUrl="blob:preview"
        onMetadataResolved={onMetadataResolved}
        selectedImageMetadata={{
          width: 1200,
          height: 800,
          aspectRatio: "3:2",
        }}
        bestProportion="horizontal"
        userSelectedProportion="horizontal"
        previewEffects={null}
      />,
    );

    await waitFor(() => {
      expect(previewCanvasUtils.drawCroppedImageToCanvas).toHaveBeenCalledTimes(
        1,
      );
    });

    expect(previewCanvasUtils.loadImageElement).toHaveBeenCalledTimes(1);

    rerender(
      <Harness
        previewUrl="blob:preview"
        onMetadataResolved={onMetadataResolved}
        selectedImageMetadata={{
          width: 1200,
          height: 800,
          aspectRatio: "3:2",
        }}
        bestProportion="horizontal"
        userSelectedProportion="horizontal"
        previewEffects={null}
        previewCropAdjust={{ zoom: 2, panX: 0, panY: 0 }}
      />,
    );

    await waitFor(() => {
      expect(previewCanvasUtils.drawCroppedImageToCanvas).toHaveBeenCalledTimes(
        2,
      );
    });

    expect(previewCanvasUtils.loadImageElement).toHaveBeenCalledTimes(1);
  });

  it("redraws canvas on subsequent previewCropAdjust changes using cached image", async () => {
    const onMetadataResolved = vi.fn();
    const image = document.createElement("img");

    vi.mocked(previewCanvasUtils.loadImageElement).mockResolvedValue(image);
    vi.mocked(previewCanvasUtils.resolveImageDimensions).mockReturnValue({
      sourceWidth: 1200,
      sourceHeight: 800,
    });
    vi.mocked(previewRenderPlan.buildPreviewRenderPlan).mockReturnValue({
      metadata: { width: 1200, height: 800, aspectRatio: "3:2" },
      nextDisplayImageProportion: "horizontal",
      shouldAutoSelectOptimalProportion: false,
      crop: {
        cropX: 0,
        cropY: 0,
        cropWidth: 1200,
        cropHeight: 675,
        outputWidth: 1200,
        outputHeight: 675,
        sourceArea: 960000,
        cropArea: 810000,
        coverageRatio: 0.84375,
        coveragePercent: 84.38,
        widthScale: 1,
        heightScale: 0.84375,
      },
    });

    const { rerender } = render(
      <Harness
        previewUrl="blob:preview"
        onMetadataResolved={onMetadataResolved}
        selectedImageMetadata={{
          width: 1200,
          height: 800,
          aspectRatio: "3:2",
        }}
        bestProportion="horizontal"
        userSelectedProportion="horizontal"
        previewEffects={null}
        previewCropAdjust={{ zoom: 1.5, panX: 0, panY: 0 }}
      />,
    );

    await waitFor(() => {
      expect(previewCanvasUtils.drawCroppedImageToCanvas).toHaveBeenCalledTimes(
        1,
      );
    });

    rerender(
      <Harness
        previewUrl="blob:preview"
        onMetadataResolved={onMetadataResolved}
        selectedImageMetadata={{
          width: 1200,
          height: 800,
          aspectRatio: "3:2",
        }}
        bestProportion="horizontal"
        userSelectedProportion="horizontal"
        previewEffects={null}
        previewCropAdjust={{ zoom: 2.0, panX: 0.3, panY: 0 }}
      />,
    );

    await waitFor(() => {
      expect(previewCanvasUtils.drawCroppedImageToCanvas).toHaveBeenCalledTimes(
        2,
      );
    });

    expect(previewCanvasUtils.loadImageElement).toHaveBeenCalledTimes(1);
  });

  it("reloads image and updates cache when previewUrl changes after cache was populated", async () => {
    const onMetadataResolved = vi.fn();
    const image1 = document.createElement("img");
    const image2 = document.createElement("img");

    vi.mocked(previewCanvasUtils.loadImageElement)
      .mockResolvedValueOnce(image1)
      .mockResolvedValueOnce(image2);
    vi.mocked(previewCanvasUtils.resolveImageDimensions).mockReturnValue({
      sourceWidth: 1200,
      sourceHeight: 800,
    });
    vi.mocked(previewRenderPlan.buildPreviewRenderPlan).mockReturnValue({
      metadata: { width: 1200, height: 800, aspectRatio: "3:2" },
      nextDisplayImageProportion: "horizontal",
      shouldAutoSelectOptimalProportion: false,
      crop: {
        cropX: 0,
        cropY: 0,
        cropWidth: 1200,
        cropHeight: 675,
        outputWidth: 1200,
        outputHeight: 675,
        sourceArea: 960000,
        cropArea: 810000,
        coverageRatio: 0.84375,
        coveragePercent: 84.38,
        widthScale: 1,
        heightScale: 0.84375,
      },
    });

    const { rerender } = render(
      <Harness
        previewUrl="blob:preview1"
        onMetadataResolved={onMetadataResolved}
        selectedImageMetadata={{
          width: 1200,
          height: 800,
          aspectRatio: "3:2",
        }}
        bestProportion="horizontal"
        userSelectedProportion="horizontal"
        previewEffects={null}
      />,
    );

    await waitFor(() => {
      expect(previewCanvasUtils.loadImageElement).toHaveBeenCalledTimes(1);
    });
    expect(previewCanvasUtils.loadImageElement).toHaveBeenCalledWith(
      "blob:preview1",
    );

    rerender(
      <Harness
        previewUrl="blob:preview2"
        onMetadataResolved={onMetadataResolved}
        selectedImageMetadata={{
          width: 1200,
          height: 800,
          aspectRatio: "3:2",
        }}
        bestProportion="horizontal"
        userSelectedProportion="horizontal"
        previewEffects={null}
      />,
    );

    await waitFor(() => {
      expect(previewCanvasUtils.loadImageElement).toHaveBeenCalledTimes(2);
    });
    expect(previewCanvasUtils.loadImageElement).toHaveBeenCalledWith(
      "blob:preview2",
    );
  });

  it("redraws canvas when previewCropAdjust is reset to undefined", async () => {
    const onMetadataResolved = vi.fn();
    const image = document.createElement("img");

    vi.mocked(previewCanvasUtils.loadImageElement).mockResolvedValue(image);
    vi.mocked(previewCanvasUtils.resolveImageDimensions).mockReturnValue({
      sourceWidth: 1200,
      sourceHeight: 800,
    });
    vi.mocked(previewRenderPlan.buildPreviewRenderPlan).mockReturnValue({
      metadata: { width: 1200, height: 800, aspectRatio: "3:2" },
      nextDisplayImageProportion: "horizontal",
      shouldAutoSelectOptimalProportion: false,
      crop: {
        cropX: 0,
        cropY: 0,
        cropWidth: 1200,
        cropHeight: 675,
        outputWidth: 1200,
        outputHeight: 675,
        sourceArea: 960000,
        cropArea: 810000,
        coverageRatio: 0.84375,
        coveragePercent: 84.38,
        widthScale: 1,
        heightScale: 0.84375,
      },
    });

    const { rerender } = render(
      <Harness
        previewUrl="blob:preview"
        onMetadataResolved={onMetadataResolved}
        selectedImageMetadata={{
          width: 1200,
          height: 800,
          aspectRatio: "3:2",
        }}
        bestProportion="horizontal"
        userSelectedProportion="horizontal"
        previewEffects={null}
        previewCropAdjust={{ zoom: 2, panX: 0, panY: 0 }}
      />,
    );

    await waitFor(() => {
      expect(previewCanvasUtils.drawCroppedImageToCanvas).toHaveBeenCalledTimes(
        1,
      );
    });

    rerender(
      <Harness
        previewUrl="blob:preview"
        onMetadataResolved={onMetadataResolved}
        selectedImageMetadata={{
          width: 1200,
          height: 800,
          aspectRatio: "3:2",
        }}
        bestProportion="horizontal"
        userSelectedProportion="horizontal"
        previewEffects={null}
      />,
    );

    await waitFor(() => {
      expect(previewCanvasUtils.drawCroppedImageToCanvas).toHaveBeenCalledTimes(
        2,
      );
    });

    expect(previewCanvasUtils.loadImageElement).toHaveBeenCalledTimes(1);
  });

  it("redraws canvas when both previewCropAdjust and previewEffects change in the same rerender", async () => {
    const onMetadataResolved = vi.fn();
    const image = document.createElement("img");

    vi.mocked(previewCanvasUtils.loadImageElement).mockResolvedValue(image);
    vi.mocked(previewCanvasUtils.resolveImageDimensions).mockReturnValue({
      sourceWidth: 1200,
      sourceHeight: 800,
    });
    vi.mocked(previewRenderPlan.buildPreviewRenderPlan).mockReturnValue({
      metadata: { width: 1200, height: 800, aspectRatio: "3:2" },
      nextDisplayImageProportion: "horizontal",
      shouldAutoSelectOptimalProportion: false,
      crop: {
        cropX: 0,
        cropY: 0,
        cropWidth: 1200,
        cropHeight: 675,
        outputWidth: 1200,
        outputHeight: 675,
        sourceArea: 960000,
        cropArea: 810000,
        coverageRatio: 0.84375,
        coveragePercent: 84.38,
        widthScale: 1,
        heightScale: 0.84375,
      },
    });

    const { rerender } = render(
      <Harness
        previewUrl="blob:preview"
        onMetadataResolved={onMetadataResolved}
        selectedImageMetadata={{
          width: 1200,
          height: 800,
          aspectRatio: "3:2",
        }}
        bestProportion="horizontal"
        userSelectedProportion="horizontal"
        previewEffects={{ brightness: 0, contrast: 0 }}
      />,
    );

    await waitFor(() => {
      expect(previewCanvasUtils.drawCroppedImageToCanvas).toHaveBeenCalledTimes(
        1,
      );
    });

    rerender(
      <Harness
        previewUrl="blob:preview"
        onMetadataResolved={onMetadataResolved}
        selectedImageMetadata={{
          width: 1200,
          height: 800,
          aspectRatio: "3:2",
        }}
        bestProportion="horizontal"
        userSelectedProportion="horizontal"
        previewEffects={{ brightness: 30, contrast: -10 }}
        previewCropAdjust={{ zoom: 1.5, panX: 0, panY: 0 }}
      />,
    );

    await waitFor(() => {
      expect(previewCanvasUtils.drawCroppedImageToCanvas).toHaveBeenCalledTimes(
        2,
      );
    });

    expect(
      vi.mocked(previewCanvasUtils.drawCroppedImageToCanvas),
    ).toHaveBeenLastCalledWith(
      expect.objectContaining({
        effects: { brightness: 30, contrast: -10 },
      }),
    );
    expect(previewCanvasUtils.loadImageElement).toHaveBeenCalledTimes(1);
  });

  it("handles rapid successive previewCropAdjust changes without errors", async () => {
    const onMetadataResolved = vi.fn();
    const image = document.createElement("img");

    vi.mocked(previewCanvasUtils.loadImageElement).mockResolvedValue(image);
    vi.mocked(previewCanvasUtils.resolveImageDimensions).mockReturnValue({
      sourceWidth: 1200,
      sourceHeight: 800,
    });
    vi.mocked(previewRenderPlan.buildPreviewRenderPlan).mockReturnValue({
      metadata: { width: 1200, height: 800, aspectRatio: "3:2" },
      nextDisplayImageProportion: "horizontal",
      shouldAutoSelectOptimalProportion: false,
      crop: {
        cropX: 0,
        cropY: 0,
        cropWidth: 1200,
        cropHeight: 675,
        outputWidth: 1200,
        outputHeight: 675,
        sourceArea: 960000,
        cropArea: 810000,
        coverageRatio: 0.84375,
        coveragePercent: 84.38,
        widthScale: 1,
        heightScale: 0.84375,
      },
    });

    const { rerender } = render(
      <Harness
        previewUrl="blob:preview"
        onMetadataResolved={onMetadataResolved}
        selectedImageMetadata={{
          width: 1200,
          height: 800,
          aspectRatio: "3:2",
        }}
        bestProportion="horizontal"
        userSelectedProportion="horizontal"
        previewEffects={null}
      />,
    );

    await waitFor(() => {
      expect(previewCanvasUtils.drawCroppedImageToCanvas).toHaveBeenCalledTimes(
        1,
      );
    });

    const zoomLevels = [1.1, 1.2, 1.5, 2.0, 2.5, 3.0, 2.0, 1.5];
    for (const zoom of zoomLevels) {
      rerender(
        <Harness
          previewUrl="blob:preview"
          onMetadataResolved={onMetadataResolved}
          selectedImageMetadata={{
            width: 1200,
            height: 800,
            aspectRatio: "3:2",
          }}
          bestProportion="horizontal"
          userSelectedProportion="horizontal"
          previewEffects={null}
          previewCropAdjust={{ zoom, panX: 0, panY: 0 }}
        />,
      );
    }

    await waitFor(() => {
      expect(previewCanvasUtils.drawCroppedImageToCanvas).toHaveBeenCalledTimes(
        1 + zoomLevels.length,
      );
    });

    expect(previewCanvasUtils.loadImageElement).toHaveBeenCalledTimes(1);
  });
});
