import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { ImageUploader } from "./image-uploader";
import { splitImageIntoVerticalThirdFiles } from "./image-uploader/split-image-into-thirds";
import type { SelectedImageItem } from "./image-uploader/image-uploader";
import {
  FooterToolsBar,
  type FooterToolsBarProps,
} from "@/components/footer-tools-bar";

vi.mock("./image-uploader/split-image-into-thirds", () => ({
  splitImageIntoVerticalThirdFiles: vi.fn(),
}));

const mockLoadImageDimensions = vi.hoisted(() =>
  vi.fn().mockResolvedValue({ width: 1200, height: 800 }),
);
const mockReadJpegExifResolution = vi.hoisted(() =>
  vi.fn().mockResolvedValue(null),
);

vi.mock("./image-uploader/load-image-dimensions", () => ({
  loadImageDimensions: mockLoadImageDimensions,
}));

vi.mock("./image-uploader/jpeg-exif-reader", () => ({
  readJpegExifResolution: mockReadJpegExifResolution,
}));

let latestSlotSwitcherProps: {
  slots: Array<SelectedImageItem | null>;
  activeSlotIndex: number | null;
} | null = null;
let latestEffectsProps: {
  activeImageEffects: SelectedImageItem["previewEffects"] | null;
  onUpdateEffect: (name: "brightness" | "contrast" | "grayscale", val: number) => void;
} | null = null;

vi.mock("./image-uploader/uploader-preview-slider", () => ({
  default: ({ activeImage }: { activeImage: SelectedImageItem | null }) =>
    activeImage ? <img alt="Preview" src={activeImage.previewUrl} /> : null,
}));

vi.mock("./image-uploader/uploader-slot-switcher", () => ({
  UploaderSlotSwitcher: (props: {
    slots: Array<SelectedImageItem | null>;
    activeSlotIndex: number | null;
  }) => {
    latestSlotSwitcherProps = props;
    return <div data-testid="mock-slot-switcher" />;
  },
}));

vi.mock("./image-uploader/uploader-preview-tools-panel", () => ({
  default: (props: {
    activeImageEffects: SelectedImageItem["previewEffects"] | null;
    onUpdateEffect: (name: "brightness" | "contrast" | "grayscale", val: number) => void;
    externalEditMode?: boolean;
  }) => {
    latestEffectsProps = props;

    return (
      <div>
        <button
          type="button"
          data-testid="apply-brightness-effect"
          onClick={() => props.onUpdateEffect("brightness", 40)}
        >
          apply brightness
        </button>
      </div>
    );
  },
}));

vi.mock("@/components/footer-tools-bar", () => ({
  FooterToolsBar: (props: FooterToolsBarProps) => {
    return (
      <div>
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

function TestWrapper() {
  const [toolsBarProps, setToolsBarProps] = useState<FooterToolsBarProps | null>(null);

  return (
    <>
      <ImageUploader
        onToolsPanelPropsChange={setToolsBarProps}
      />
      {toolsBarProps && <FooterToolsBar {...toolsBarProps} />}
    </>
  );
}

describe("ImageUploader split effects regression", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    latestSlotSwitcherProps = null;
    latestEffectsProps = null;
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

    render(<TestWrapper />);

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
      expect(latestSlotSwitcherProps?.slots).toHaveLength(3);
      expect(latestSlotSwitcherProps?.activeSlotIndex).toBe(1);
      expect(latestEffectsProps?.activeImageEffects).toEqual({
        brightness: 40,
        contrast: 0,
        grayscale: 0,
        removeBackground: false,
        enhance: false,
        upscale: false,
        restore: false,
      });
      expect(latestSlotSwitcherProps?.slots[1]?.previewEffects).toEqual({
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
