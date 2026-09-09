import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { ImageUploader } from "./image-uploader";
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

    // Dimensions are known at insertion (from validation), so the split uses
    // the seamless-window model: three window slots sharing one source,
    // each inheriting the pre-split effects.
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
      expect(latestSlotSwitcherProps?.slots[1]?.triptychWindowIndex).toBe(1);
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
    // 4400x2200 (2:1) source: the recommended pre-split size is 2 (90x60 —
    // 120x80 needs more pixels than the resting crop provides). Each split
    // window is ~1466x2200, which prints only up to 75x50 (index 1), so the
    // post-split size must land at min(2, 1) = 1 — derived from the source
    // size, never upgraded to the largest printable size.
    mockLoadImageDimensions.mockResolvedValue({ width: 4400, height: 2200 });

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

    // Dimensions are known at insertion, so the recommended size (2) is
    // auto-selected without waiting for the preview to decode.
    await waitFor(() => {
      expect(screen.getByTestId("selected-painting-size").textContent).toBe(
        "2",
      );
    });

    fireEvent.click(screen.getByTestId("split-active-image"));

    // The split resolves synchronously into three window slots; the size
    // follows the window projection (capped at the source size).
    await waitFor(() => {
      expect(latestSlotSwitcherProps?.slots).toHaveLength(3);
    });

    await waitFor(() => {
      expect(screen.getByTestId("selected-painting-size").textContent).toBe(
        "1",
      );
    });
  });
});
