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
  onUpdateEffect: (
    effectName: "brightness" | "contrast",
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
    onUpdateEffect: (
      effectName: "brightness" | "contrast",
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

  it("propagates active image effects to all split parts", async () => {
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
      const slots = latestToolsPanelProps?.slots ?? [];
      expect(slots).toHaveLength(3);
      expect(slots.every((slot) => !!slot)).toBe(true);
      expect(
        slots.every(
          (slot) =>
            !!slot &&
            slot.previewEffects.brightness === 40 &&
            slot.previewEffects.contrast === 0,
        ),
      ).toBe(true);
    });
  });
});
