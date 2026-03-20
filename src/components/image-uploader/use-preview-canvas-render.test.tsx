import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { useEffect, useRef, useState, useCallback } from "react";
import { usePreviewCanvasRender } from "./use-preview-canvas-render";
import * as previewCanvasUtils from "./preview-canvas-utils";
import * as previewRenderPlan from "./preview-render-plan";
import type { ImageDisplayProportion } from "./image-proportion-calculator";
import type { SelectedImageMetadata } from "./image-uploader";

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
}

function Harness({
  previewUrl,
  onMetadataResolved,
  selectedImageMetadata,
  bestProportion,
  userSelectedProportion,
}: HarnessProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const latestRenderConfigRef = useRef({
    selectedImageMetadata,
    bestProportion,
    userSelectedProportion,
  });

  useEffect(() => {
    latestRenderConfigRef.current = {
      selectedImageMetadata,
      bestProportion,
      userSelectedProportion,
    };
  }, [bestProportion, selectedImageMetadata, userSelectedProportion]);

  usePreviewCanvasRender({
    previewUrl,
    canvasRef,
    selectedImageMetadata,
    bestProportion,
    userSelectedProportion,
    latestRenderConfigRef,
    onMetadataResolved,
  });

  return <canvas ref={canvasRef} data-testid="canvas" />;
}

describe("usePreviewCanvasRender", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
      />,
    );

    rerender(
      <Harness
        previewUrl={null}
        onMetadataResolved={onMetadataResolved}
        selectedImageMetadata={null}
        bestProportion={null}
        userSelectedProportion="horizontal"
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
      />,
    );

    await waitFor(() => {
      expect(previewCanvasUtils.loadImageElement).toHaveBeenCalledTimes(2);
    });

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
      });

      useEffect(() => {
        latestRenderConfigRef.current = {
          selectedImageMetadata: storedMetadata,
          bestProportion: null,
          userSelectedProportion: "horizontal",
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
});
