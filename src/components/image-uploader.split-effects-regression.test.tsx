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
import type { SlotSwitcherBarProps } from "./image-uploader/uploader-slot-switcher";

vi.mock("./image-uploader/split-image-into-thirds", () => ({
  splitImageIntoVerticalThirdFiles: vi.fn(),
}));

const mockLoadImageDimensions = vi.hoisted(() =>
  vi.fn().mockResolvedValue({ width: 3000, height: 2000 }),
);

vi.mock("./image-uploader/load-image-dimensions", () => ({
  loadImageDimensions: mockLoadImageDimensions,
}));

let latestSlotSwitcherProps: SlotSwitcherBarProps | null = null;
let latestEffectsProps: {
  activeImageEffects: SelectedImageItem["previewEffects"] | null;
  onUpdateEffect: (name: "brightness" | "contrast" | "grayscale", val: number) => void;
} | null = null;

vi.mock("./image-uploader/uploader-preview-slider", () => ({
  default: ({ activeImage }: { activeImage: SelectedImageItem | null }) =>
    activeImage ? <img alt="Preview" src={activeImage.previewUrl} /> : null,
}));

vi.mock("./image-uploader/uploader-slot-switcher", () => ({
  SlotSwitcherBarProps: undefined,
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
        <button
          type="button"
          data-testid="simulate-effects-reset"
          onClick={() => {
            // Mirrors the settings drawer's reset: every slider is zeroed in
            // one event. Regression guard: these must compose, not clobber.
            props.onUpdateEffect("brightness", 0);
            props.onUpdateEffect("contrast", 0);
            props.onUpdateEffect("grayscale", 0);
          }}
        >
          reset effects
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
        <span data-testid="selected-painting-size">
          {props.selectedPaintingSize}
        </span>
      </div>
    );
  },
}));

function TestWrapper() {
  const [toolsBarProps, setToolsBarProps] = useState<FooterToolsBarProps | null>(null);
  const [, setSlotSwitcherProps] = useState<SlotSwitcherBarProps | null>(null);

  return (
    <>
      <ImageUploader
        onToolsPanelPropsChange={setToolsBarProps}
        onSlotSwitcherPropsChange={(props) => {
          latestSlotSwitcherProps = props;
          setSlotSwitcherProps(props);
        }}
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
      expect(splitImageIntoVerticalThirdFiles).toHaveBeenCalledWith(
        expect.objectContaining({
          previewUrl: expect.stringContaining("blob:"),
          sourceFile,
        }),
      );
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

  it("zeroes every adjustment when the settings drawer reset fires all effect updates in one event", async () => {
    const sourceFile = new File(["source"], "source.jpg", {
      type: "image/jpeg",
    });

    render(<TestWrapper />);

    const input = document.querySelector(
      'input[type="file"][accept*="image/jpeg"]',
    ) as HTMLInputElement | null;
    expect(input).toBeTruthy();
    if (!input) return;

    fireEvent.change(input, { target: { files: [sourceFile] } });
    await screen.findByRole("img", { name: "Preview" });

    const effects = latestEffectsProps!;
    effects.onUpdateEffect("brightness", 60);
    effects.onUpdateEffect("contrast", -30);
    effects.onUpdateEffect("grayscale", 80);

    await waitFor(() => {
      expect(latestEffectsProps?.activeImageEffects).toMatchObject({
        brightness: 60,
        contrast: -30,
        grayscale: 80,
      });
    });

    fireEvent.click(screen.getByTestId("simulate-effects-reset"));

    await waitFor(() => {
      expect(latestEffectsProps?.activeImageEffects).toMatchObject({
        brightness: 0,
        contrast: 0,
        grayscale: 0,
      });
    });
  });

  it("caps the post-split size at the source size instead of upgrading to the largest printable size", async () => {
    // High-resolution source: even one-third panels remain printable at every
    // rectangular size, but the chosen (source) size must be preserved.
    mockLoadImageDimensions.mockResolvedValue({ width: 16000, height: 10000 });

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
    if (!input) return;

    fireEvent.change(input, { target: { files: [sourceFile] } });
    await screen.findByRole("img", { name: "Preview" });

    // Source defaults to size index 2 (90x60).
    expect(screen.getByTestId("selected-painting-size").textContent).toBe("2");

    fireEvent.click(screen.getByTestId("split-active-image"));

    await waitFor(() => {
      expect(splitImageIntoVerticalThirdFiles).toHaveBeenCalledWith(
        expect.objectContaining({
          previewUrl: expect.stringContaining("blob:"),
          sourceFile,
        }),
      );
    });

    // After split the size stays at 2 (source height preserved), never upgraded
    // to the largest printable size even though larger sizes remain printable.
    await waitFor(() => {
      expect(screen.getByTestId("selected-painting-size").textContent).toBe("2");
    });
  });
});
