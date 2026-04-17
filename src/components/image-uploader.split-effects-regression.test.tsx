import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ImageUploader } from "./image-uploader";
import { splitImageIntoVerticalThirdFiles } from "./image-uploader/split-image-into-thirds";
import type { SelectedImageItem } from "./image-uploader/image-uploader";

vi.mock("./image-uploader/split-image-into-thirds", () => ({
  splitImageIntoVerticalThirdFiles: vi.fn(),
}));

let latestToolsPanelProps: {
  slots: Array<SelectedImageItem | null>;
  activeSlotIndex: number | null;
  activeImageEffects: {
    brightness: number;
    contrast: number;
    grayscale: number;
    removeBackground?: boolean;
    enhance?: boolean;
  } | null;
  onUpdateEffect: (
    effectName: "brightness" | "contrast" | "grayscale",
    value: number,
  ) => void;
  onSplitImage: () => void;
} | null = null;

vi.mock("./image-uploader/uploader-preview-slider", () => ({
  default: ({ activeImage }: { activeImage: SelectedImageItem | null }) =>
    activeImage ? <img alt="Preview" src={activeImage.previewUrl} /> : null,
}));

vi.mock("./image-uploader/uploader-preview-tools-panel", () => ({
  default: (props: {
    slots: Array<SelectedImageItem | null>;
    activeSlotIndex: number | null;
    activeImageEffects: {
      brightness: number;
      contrast: number;
      grayscale: number;
      removeBackground?: boolean;
      enhance?: boolean;
    } | null;
    onUpdateEffect: (
      effectName: "brightness" | "contrast" | "grayscale",
      value: number,
    ) => void;
    onSplitImage: () => void;
  }) => {
    latestToolsPanelProps = props;

    return (
      <div>
        <button
          type="button"
          data-testid="apply-brightness-effect"
          onClick={() => props.onUpdateEffect("brightness", 40)}
        >
          apply brightness
        </button>
        <button
          type="button"
          data-testid="split-active-image"
          onClick={props.onSplitImage}
        >
          split
        </button>
      </div>
    );
  },
}));

describe("ImageUploader split effects regression", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    latestToolsPanelProps = null;
  });

  it("keeps the applied effects on the newly active split slot", async () => {
    const sourceFile = new File(["source"], "source.jpg", {
      type: "image/jpeg",
    });
    const splitPartFiles: [File, File, File] = [
      new File(["left"], "source-part-1.jpg", { type: "image/jpeg" }),
      new File(["center"], "source-part-2.jpg", { type: "image/jpeg" }),
      new File(["right"], "source-part-3.jpg", { type: "image/jpeg" }),
    ];

    vi.mocked(splitImageIntoVerticalThirdFiles).mockResolvedValue(
      splitPartFiles,
    );

    render(<ImageUploader />);

    const input = document.querySelector(
      'input[type="file"][accept*="image/jpeg"]',
    ) as HTMLInputElement | null;

    expect(input).toBeTruthy();

    if (!input) {
      return;
    }

    fireEvent.change(input, { target: { files: [sourceFile] } });
    await screen.findByRole("img", { name: "Preview" });

    fireEvent.click(screen.getByTestId("apply-brightness-effect"));
    fireEvent.click(screen.getByTestId("split-active-image"));

    await waitFor(() => {
      expect(splitImageIntoVerticalThirdFiles).toHaveBeenCalledWith({
        previewUrl: expect.stringContaining("blob:"),
        sourceFile,
      });
    });

    await waitFor(() => {
      expect(latestToolsPanelProps?.slots).toHaveLength(3);
      expect(latestToolsPanelProps?.activeSlotIndex).toBe(1);
      expect(latestToolsPanelProps?.activeImageEffects).toEqual({
        brightness: 40,
        contrast: 0,
        grayscale: 0,
        removeBackground: false,
        enhance: false,
        upscale: false,
        restore: false,
      });
      expect(latestToolsPanelProps?.slots[1]?.previewEffects).toEqual({
        brightness: 40,
        contrast: 0,
        grayscale: 0,
        removeBackground: false,
        enhance: false,
        upscale: false,
        restore: false,
      });
    });
  });
});
