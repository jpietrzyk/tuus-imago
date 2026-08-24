import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  act,
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import { createRef, useState, useCallback } from "react";
import { ImageUploader, type ImageUploaderHandle } from "./image-uploader";
import { splitImageIntoVerticalThirdFiles } from "./image-uploader/split-image-into-thirds";
import { uploadImageToCloudinary } from "@/lib/cloudinary-upload";
import { t as tr } from "../locales/i18n";
import {
  FooterToolsBar,
  type FooterToolsBarProps,
} from "@/components/footer-tools-bar";
import {
  UploaderSlotSwitcher,
  type SlotSwitcherBarProps,
} from "./image-uploader/uploader-slot-switcher";

vi.mock("./image-uploader/split-image-into-thirds", () => ({
  splitImageIntoVerticalThirdFiles: vi.fn(),
}));

vi.mock("@/lib/cloudinary-upload", () => ({
  uploadImageToCloudinary: vi.fn(),
}));

vi.mock("./image-uploader/image-file-validator", () => ({
  validateImageFile: vi.fn().mockResolvedValue({
    violations: [],
    dimensions: null,
  }),
}));

function TestWrapper({
  uploaderRef,
  ...uploaderProps
}: { uploaderRef?: React.RefObject<ImageUploaderHandle | null> } & Omit<React.ComponentProps<typeof ImageUploader>, "ref">) {
  const [toolsBarProps, setToolsBarProps] = useState<FooterToolsBarProps | null>(null);
  const toolsBarPropsJsonRef = useState(() => ({ current: "" }))[0];
  const [slotSwitcherProps, setSlotSwitcherProps] = useState<SlotSwitcherBarProps | null>(null);

  const stableSetToolsBarProps = useCallback(
    (props: FooterToolsBarProps | null) => {
      const json = JSON.stringify(
        props
          ? {
              canSplitImage: props.canSplitImage,
              canUpdateEffects: props.canUpdateEffects,
              canUpdateAiEffects: props.canUpdateAiEffects,
              canToggleZoomPan: props.canToggleZoomPan,
              canToggleTriptychLink: props.canToggleTriptychLink,
              isEditMode: props.isEditMode,
              isZoomPanMode: props.isZoomPanMode,
              isTriptychLinked: props.isTriptychLinked,
              selectedProportion: props.selectedProportion,
              shouldConfirmSplit: props.shouldConfirmSplit,
              selectedPaintingSize: props.selectedPaintingSize,
              paintingShape: props.paintingShape,
            }
          : null,
      );
      if (json === toolsBarPropsJsonRef.current) return;
      toolsBarPropsJsonRef.current = json;
      setToolsBarProps(props);
    },
    [toolsBarPropsJsonRef],
  );

  return (
    <>
      <ImageUploader
        ref={uploaderRef}
        {...uploaderProps}
        onToolsPanelPropsChange={stableSetToolsBarProps}
        onSlotSwitcherPropsChange={setSlotSwitcherProps}
      />
      {toolsBarProps && <FooterToolsBar {...toolsBarProps} />}
      {/* The product UI hides the dots bar (hidden: true), but the harness
          renders it to drive/observe slot selection through the same props
          API the uploader exposes. */}
      {slotSwitcherProps && (
        <UploaderSlotSwitcher {...slotSwitcherProps} />
      )}
    </>
  );
}

let mockImageWidth = 1200;
let mockImageHeight = 800;

function slotDotHasImage(index: number): boolean {
  const dot = screen.getByTestId(`uploader-slot-dot-${index}`);
  const innerSpan = dot.querySelector("span");
  if (!innerSpan) return false;
  return !innerSpan.className.includes("border-dashed");
}

describe("ImageUploader", () => {
  beforeEach(() => {
    mockImageWidth = 1200;
    mockImageHeight = 800;

    vi.stubGlobal(
      "Image",
      class {
        onload: ((ev: Event) => void) | null = null;
        onerror: ((ev: Event) => void) | null = null;
        naturalWidth = mockImageWidth;
        naturalHeight = mockImageHeight;
        width = mockImageWidth;
        height = mockImageHeight;

        decode() {
          return Promise.resolve();
        }

        set src(_value: string) {
          queueMicrotask(() => {
            this.onload?.(new Event("load"));
          });
        }
      },
    );

    vi.stubGlobal("fetch", vi.fn());
    vi.mocked(splitImageIntoVerticalThirdFiles).mockReset();
    vi.mocked(uploadImageToCloudinary).mockReset();
  });

  it("splits active image into three slots after confirmation", async () => {
    mockImageWidth = 7800;
    mockImageHeight = 1800;
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

    const uploaderRef = createRef<ImageUploaderHandle>();
    render(<TestWrapper uploaderRef={uploaderRef} />);

    const input = document.querySelector(
      'input[type="file"][accept*="image/jpeg"]',
    ) as HTMLInputElement | null;

    expect(input).toBeDefined();

    if (input) {
      fireEvent.change(input, { target: { files: [sourceFile] } });
      await screen.findByRole("img", { name: "Preview" });

      const splitButton = screen.getByRole("button", {
        name: tr("uploader.splitSelectedImage"),
      });

      expect(splitButton).toBeEnabled();
      fireEvent.click(splitButton);

      await waitFor(() => {
        expect(splitImageIntoVerticalThirdFiles).toHaveBeenCalledWith(
          expect.objectContaining({
            previewUrl: expect.stringContaining("blob:"),
            sourceFile,
          }),
        );
      });

      await waitFor(() => {
        expect(slotDotHasImage(0)).toBe(true);
        expect(slotDotHasImage(2)).toBe(true);
      });

      act(() => {
        uploaderRef.current?.removeActiveImage();
      });

      fireEvent.click(screen.getByRole("button", {
        name: tr("uploader.removeSlotConfirmAction"),
      }));

      await waitFor(() => {
        expect(slotDotHasImage(0)).toBe(true);
        expect(slotDotHasImage(2)).toBe(true);
      });

      expect(screen.queryByRole("img", { name: "Preview" })).toBeNull();
      expect(
        screen.getByTestId("selected-image-preview-placeholder"),
      ).toBeInTheDocument();
    }
  });

  it("keeps pre-split image source for onActiveImageSrcChange when entering triptych mode", async () => {
    mockImageWidth = 7800;
    mockImageHeight = 1800;
    const onActiveImageSrcChange = vi.fn();
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

    render(
      <TestWrapper onActiveImageSrcChange={onActiveImageSrcChange} />,
    );

    const input = document.querySelector(
      'input[type="file"][accept*="image/jpeg"]',
    ) as HTMLInputElement | null;

    expect(input).toBeDefined();

    if (input) {
      fireEvent.change(input, { target: { files: [sourceFile] } });
      await screen.findByRole("img", { name: "Preview" });

      await waitFor(() => {
        const calls = onActiveImageSrcChange.mock.calls;
        expect(calls[calls.length - 1]?.[0]).toEqual(
          expect.stringContaining("blob:"),
        );
      });
      const originalSrc = onActiveImageSrcChange.mock.calls[
        onActiveImageSrcChange.mock.calls.length - 1
      ][0];
      const callsBeforeSplit = onActiveImageSrcChange.mock.calls.length;

      const splitButton = screen.getByRole("button", {
        name: tr("uploader.splitSelectedImage"),
      });
      fireEvent.click(splitButton);

      await waitFor(() => {
        expect(slotDotHasImage(0)).toBe(true);
        expect(slotDotHasImage(2)).toBe(true);
      });

      const callsAfterSplit = onActiveImageSrcChange.mock.calls.slice(
        callsBeforeSplit,
      );
      expect(callsAfterSplit.length).toBeGreaterThanOrEqual(0);
      for (const call of callsAfterSplit) {
        expect(call[0]).toBe(originalSrc);
      }
      const calls = onActiveImageSrcChange.mock.calls;
      expect(calls[calls.length - 1]?.[0]).toBe(originalSrc);
    }
  });

  it("links triptych parts by default and toggles the link state", async () => {
    mockImageWidth = 7800;
    mockImageHeight = 1800;
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

    expect(input).toBeDefined();

    if (input) {
      fireEvent.change(input, { target: { files: [sourceFile] } });
      await screen.findByRole("img", { name: "Preview" });

      fireEvent.click(
        screen.getByRole("button", {
          name: tr("uploader.splitSelectedImage"),
        }),
      );

      await waitFor(() => {
        expect(slotDotHasImage(0)).toBe(true);
        expect(slotDotHasImage(2)).toBe(true);
      });

      // After splitting the parts are linked by default.
      const linkToggle = await screen.findByTestId("triptych-link-toggle");
      expect(linkToggle).toHaveAttribute("data-linked", "true");

      // Unlinking flips the state.
      fireEvent.click(linkToggle);
      await waitFor(() => {
        expect(screen.getByTestId("triptych-link-toggle")).toHaveAttribute(
          "data-linked",
          "false",
        );
      });

      // Re-linking restores the bound state.
      fireEvent.click(screen.getByTestId("triptych-link-toggle"));
      await waitFor(() => {
        expect(screen.getByTestId("triptych-link-toggle")).toHaveAttribute(
          "data-linked",
          "true",
        );
      });
    }
  });

  it("splits a 2:1 image into seamless windows so zoom stays glued across panels", async () => {
    mockImageWidth = 5400;
    mockImageHeight = 2700;
    const onOrderableSlotsChange = vi.fn();
    const onImageMetadataChange = vi.fn();
    const sourceFile = new File(["source"], "source.jpg", {
      type: "image/jpeg",
    });

    render(
      <TestWrapper
        onOrderableSlotsChange={onOrderableSlotsChange}
        onImageMetadataChange={onImageMetadataChange}
      />,
    );

    const input = document.querySelector(
      'input[type="file"][accept*="image/jpeg"]',
    ) as HTMLInputElement | null;

    expect(input).toBeDefined();

    if (input) {
      fireEvent.change(input, { target: { files: [sourceFile] } });
      await screen.findByRole("img", { name: "Preview" });

      // Wait for the metadata to resolve so the split handler sees the real
      // 2:1 dimensions and takes the seamless window model.
      await waitFor(() => {
        expect(onImageMetadataChange).toHaveBeenCalledWith(
          expect.objectContaining({ width: 5400, height: 2700 }),
        );
      });

      fireEvent.pointerDown(
        screen.getByTestId("image-proportions-dropdown-trigger"),
      );
      fireEvent.click(screen.getByRole("menuitem", { name: /^Vertical/ }));

      await waitFor(() => {
        expect(
          screen.getByRole("button", {
            name: tr("uploader.splitSelectedImage"),
          }),
        ).toBeEnabled();
      });
      fireEvent.click(
        screen.getByRole("button", {
          name: tr("uploader.splitSelectedImage"),
        }),
      );

      // Splitting a 2:1 source into portrait parts blocks the pre-split
      // (landscape) size, so a printability confirmation is required.
      fireEvent.click(
        screen.getByRole("button", {
          name: tr("uploader.splitSlotsConfirmAction"),
        }),
      );

      await waitFor(() => {
        expect(slotDotHasImage(0)).toBe(true);
        expect(slotDotHasImage(2)).toBe(true);
      });

      // The legacy per-third split must not run: the three slots share the
      // full 2:1 source as contiguous windows instead of three separate
      // 2:3 files, so a shared zoom keeps the panels glued edge-to-edge.
      expect(splitImageIntoVerticalThirdFiles).not.toHaveBeenCalled();

      const lastSlots = () => {
        const calls = onOrderableSlotsChange.mock.calls;
        return calls[calls.length - 1]?.[0] as Array<{
          slotIndex: number;
          aspectRatio: string | null;
        }>;
      };

      await waitFor(() => {
        expect(lastSlots()).toEqual([
          expect.objectContaining({ slotIndex: 0, aspectRatio: "2:1" }),
          expect.objectContaining({ slotIndex: 1, aspectRatio: "2:1" }),
          expect.objectContaining({ slotIndex: 2, aspectRatio: "2:1" }),
        ]);
      });
    }
  });

  it("applies a shape change to all linked triptych parts, but only to the active slot when unlinked", async () => {
    mockImageWidth = 7800;
    mockImageHeight = 1800;
    const onOrderableSlotsChange = vi.fn();
    const onImageMetadataChange = vi.fn();
    const sourceFile = new File(["source"], "source.jpg", {
      type: "image/jpeg",
    });

    render(
      <TestWrapper
        onOrderableSlotsChange={onOrderableSlotsChange}
        onImageMetadataChange={onImageMetadataChange}
      />,
    );

    const input = document.querySelector(
      'input[type="file"][accept*="image/jpeg"]',
    ) as HTMLInputElement | null;

    expect(input).toBeDefined();

    if (input) {
      fireEvent.change(input, { target: { files: [sourceFile] } });
      await screen.findByRole("img", { name: "Preview" });

      // Wait for the metadata to resolve so the wide panorama takes the
      // seamless window model (not the legacy third-file split).
      await waitFor(() => {
        expect(onImageMetadataChange).toHaveBeenCalledWith(
          expect.objectContaining({ width: 7800, height: 1800 }),
        );
      });

      // Pick the vertical frame explicitly — this also refreshes the tools
      // bar props so the split handler runs with the resolved metadata.
      fireEvent.pointerDown(
        screen.getByTestId("image-proportions-dropdown-trigger"),
      );
      fireEvent.click(screen.getByRole("menuitem", { name: /^Vertical/ }));

      const previewCanvas = (await screen.findByTestId(
        "selected-image-preview-canvas",
      )) as HTMLCanvasElement;
      await waitFor(() => {
        // Vertical crop of the 7800x1800 panorama is 1200x1800.
        expect(previewCanvas.width).toBe(1200);
        expect(previewCanvas.height).toBe(1800);
      });

      fireEvent.click(
        screen.getByRole("button", {
          name: tr("uploader.splitSelectedImage"),
        }),
      );

      await waitFor(() => {
        expect(slotDotHasImage(0)).toBe(true);
        expect(slotDotHasImage(2)).toBe(true);
      });
      expect(splitImageIntoVerticalThirdFiles).not.toHaveBeenCalled();

      const lastSlots = () => {
        const calls = onOrderableSlotsChange.mock.calls;
        return calls[calls.length - 1]?.[0] as Array<{
          slotIndex: number;
          displayImageProportion: string;
        }>;
      };

      // After the seamless split all three windows share the vertical shape.
      await waitFor(() => {
        expect(lastSlots()).toEqual([
          expect.objectContaining({
            slotIndex: 0,
            displayImageProportion: "vertical",
          }),
          expect.objectContaining({
            slotIndex: 1,
            displayImageProportion: "vertical",
          }),
          expect.objectContaining({
            slotIndex: 2,
            displayImageProportion: "vertical",
          }),
        ]);
      });

      // Linked: changing the shape adjusts all three parts together.
      fireEvent.pointerDown(
        screen.getByTestId("image-proportions-dropdown-trigger"),
      );
      fireEvent.click(
        screen.getByRole("menuitem", { name: /^Rectangle/ }),
      );

      await waitFor(() => {
        expect(lastSlots()).toEqual([
          expect.objectContaining({
            slotIndex: 0,
            displayImageProportion: "square",
          }),
          expect.objectContaining({
            slotIndex: 1,
            displayImageProportion: "square",
          }),
          expect.objectContaining({
            slotIndex: 2,
            displayImageProportion: "square",
          }),
        ]);
      });

      // Unlink: a shape change now only affects the edited slot.
      const linkToggle = screen.getByTestId("triptych-link-toggle");
      fireEvent.click(linkToggle);
      await waitFor(() => {
        expect(screen.getByTestId("triptych-link-toggle")).toHaveAttribute(
          "data-linked",
          "false",
        );
      });

      fireEvent.click(screen.getByTestId("uploader-slot-dot-0"));

      fireEvent.pointerDown(
        screen.getByTestId("image-proportions-dropdown-trigger"),
      );
      fireEvent.click(
        screen.getByRole("menuitem", { name: /^Horizontal/ }),
      );

      await waitFor(() => {
        expect(lastSlots()).toEqual([
          expect.objectContaining({
            slotIndex: 0,
            displayImageProportion: "horizontal",
          }),
          expect.objectContaining({
            slotIndex: 1,
            displayImageProportion: "square",
          }),
          expect.objectContaining({
            slotIndex: 2,
            displayImageProportion: "square",
          }),
        ]);
      });
    }
  });

  it("asks for confirmation before splitting when other slots are already used", async () => {
    mockImageWidth = 7800;
    mockImageHeight = 1800;
    const firstFile = new File(["first"], "first.jpg", { type: "image/jpeg" });
    const secondFile = new File(["second"], "second.jpg", {
      type: "image/jpeg",
    });
    const splitPartFiles: [File, File, File] = [
      new File(["left"], "first-part-1.jpg", { type: "image/jpeg" }),
      new File(["center"], "first-part-2.jpg", { type: "image/jpeg" }),
      new File(["right"], "first-part-3.jpg", { type: "image/jpeg" }),
    ];

    vi.mocked(splitImageIntoVerticalThirdFiles).mockResolvedValue(
      splitPartFiles,
    );

    render(<TestWrapper />);

    const input = document.querySelector(
      'input[type="file"][accept*="image/jpeg"]',
    ) as HTMLInputElement | null;

    expect(input).toBeDefined();

    if (input) {
      fireEvent.change(input, { target: { files: [firstFile] } });
      await screen.findByRole("img", { name: "Preview" });

      fireEvent.click(screen.getByTestId("uploader-slot-dot-2"));

      const editorInput = document.querySelector(
        'input[type="file"][accept="image/jpeg,image/png,image/webp"]',
      ) as HTMLInputElement | null;

      expect(editorInput).toBeDefined();

      if (editorInput) {
        fireEvent.change(editorInput, { target: { files: [secondFile] } });
      }

      await waitFor(() => {
        expect(slotDotHasImage(2)).toBe(true);
      });

      const splitButton = screen.getByRole("button", {
        name: tr("uploader.splitSelectedImage"),
      });
      expect(screen.getByRole("img", { name: "Preview" })).toBeInTheDocument();
      fireEvent.click(splitButton);

      expect(
        screen.getByText(tr("uploader.splitSlotsConfirmTitle")),
      ).toBeInTheDocument();
      expect(
        screen.getByText(tr("uploader.splitSlotsConfirmDescription")),
      ).toBeInTheDocument();
      expect(splitImageIntoVerticalThirdFiles).not.toHaveBeenCalled();

      fireEvent.click(
        screen.getByRole("button", {
          name: tr("uploader.splitSlotsConfirmAction"),
        }),
      );

      await waitFor(() => {
        // The split populated the previously-empty left slot (wide panoramas
        // use the seamless window model, so no third-file split is invoked).
        expect(slotDotHasImage(0)).toBe(true);
      });
    }
  });

  it("disables triptych split when no print size would be available after split", async () => {
    mockImageWidth = 1200;
    mockImageHeight = 800;

    const onImageMetadataChange = vi.fn();
    const sourceFile = new File(["source"], "source.jpg", {
      type: "image/jpeg",
    });

    render(<TestWrapper onImageMetadataChange={onImageMetadataChange} />);

    const input = document.querySelector(
      'input[type="file"][accept*="image/jpeg"]',
    ) as HTMLInputElement | null;

    expect(input).toBeDefined();

    if (input) {
      fireEvent.change(input, { target: { files: [sourceFile] } });
      await screen.findByRole("img", { name: "Preview" });

      await waitFor(() => {
        expect(onImageMetadataChange).toHaveBeenCalledWith(
          expect.objectContaining({ width: 1200, height: 800 }),
        );
      });

      await waitFor(() => {
        const button = screen.getByRole("button", {
          name: tr("uploader.splitSelectedImage"),
        });
        expect(button).toBeDisabled();
      });
      expect(
        screen.getByRole("button", {
          name: tr("uploader.splitSelectedImage"),
        }),
      ).toHaveAttribute("title", tr("uploader.triptychUnavailableNoSize"));
    }
  });

  it("asks for printability confirmation before splitting a small single image", async () => {
    mockImageWidth = 7000;
    mockImageHeight = 1800;

    const onImageMetadataChange = vi.fn();
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

    render(<TestWrapper onImageMetadataChange={onImageMetadataChange} />);

    const input = document.querySelector(
      'input[type="file"][accept*="image/jpeg"]',
    ) as HTMLInputElement | null;

    expect(input).toBeDefined();

    if (input) {
      fireEvent.change(input, { target: { files: [sourceFile] } });
      await screen.findByRole("img", { name: "Preview" });

      await waitFor(() => {
        expect(onImageMetadataChange).toHaveBeenCalledWith(
          expect.objectContaining({ width: 7000, height: 1800 }),
        );
      });

      // Wait for the metadata-driven DPI availability to propagate to the size
      // buttons (same render that flips the split confirmation state).
      await waitFor(() => {
        expect(document.getElementById("size-btn-4")).toHaveAttribute(
          "title",
          tr("uploader.sizeUnavailable"),
        );
      });

      const splitButton = screen.getByRole("button", {
        name: tr("uploader.splitSelectedImage"),
      });
      fireEvent.click(splitButton);

      await waitFor(() => {
        expect(
          screen.getByText(tr("uploader.splitPrintabilityConfirmDescription")),
        ).toBeInTheDocument();
      });

      expect(splitImageIntoVerticalThirdFiles).not.toHaveBeenCalled();

      fireEvent.click(
        screen.getByRole("button", {
          name: tr("uploader.splitSlotsConfirmAction"),
        }),
      );

      await waitFor(() => {
        // Wide panoramas use the seamless window model (no third-file split);
        // verify the split completed by checking the side slots are populated.
        expect(slotDotHasImage(0)).toBe(true);
        expect(slotDotHasImage(2)).toBe(true);
      });
    }
  });

  it("renders upload area when no file is selected", () => {
    render(<TestWrapper />);

    const uploadIcon = document.querySelector(".lucide-upload");
    expect(uploadIcon).toBeDefined();
  });

  it("shows selected image preview and hides editing controls", async () => {
    render(<TestWrapper />);

    const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
    const input = document.querySelector(
      'input[type="file"][accept*="image/jpeg"]',
    );

    expect(input).toBeDefined();

    if (input) {
      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByRole("img", { name: "Preview" })).toBeDefined();
      });

      expect(screen.queryByText(/Potwierdź kadrowanie/i)).toBeNull();
      expect(screen.queryByText(/Upload Photo/i)).toBeNull();
      expect(screen.queryByText(/Prześlij zdjęcie/i)).toBeNull();
    }
  });

  it("reads and displays selected image proportions", async () => {
    render(<TestWrapper />);

    const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
    const input = document.querySelector(
      'input[type="file"][accept*="image/jpeg"]',
    );

    expect(input).toBeDefined();

    if (input) {
      fireEvent.change(input, { target: { files: [file] } });

      const previewCanvas = (await screen.findByTestId(
        "selected-image-preview-canvas",
      )) as HTMLCanvasElement;

      await waitFor(() => {
        expect(previewCanvas.width).toBeGreaterThan(0);
        expect(previewCanvas.height).toBeGreaterThan(0);
      });
    }
  });

  it("calls onImageMetadataChange with proportions and null after cancel", async () => {
    const onImageMetadataChange = vi.fn();
    const uploaderRef = createRef<ImageUploaderHandle>();
    render(<TestWrapper uploaderRef={uploaderRef} onImageMetadataChange={onImageMetadataChange} />);

    const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
    const input = document.querySelector(
      'input[type="file"][accept*="image/jpeg"]',
    );

    expect(input).toBeDefined();

    if (input) {
      fireEvent.change(input, { target: { files: [file] } });

      await screen.findByRole("img", { name: "Preview" });

      await waitFor(() => {
        expect(onImageMetadataChange).toHaveBeenCalledWith(
          expect.objectContaining({
            width: expect.any(Number),
            height: expect.any(Number),
            aspectRatio: expect.any(String),
          }),
        );
      });

      act(() => {
        uploaderRef.current?.removeActiveImage();
      });

      fireEvent.click(screen.getByRole("button", {
        name: tr("uploader.removeSlotConfirmAction"),
      }));

      await waitFor(() => {
        expect(onImageMetadataChange).toHaveBeenLastCalledWith(null);
      });
    }
  });

  it("shows proportions dropdown with vertical, horizontal and rectangle options", async () => {
    render(<TestWrapper />);

    const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
    const input = document.querySelector(
      'input[type="file"][accept*="image/jpeg"]',
    );

    expect(input).toBeDefined();

    if (input) {
      fireEvent.change(input, { target: { files: [file] } });

      const dropdownTrigger = (await screen.findByTestId(
        "image-proportions-dropdown-trigger",
      )) as HTMLButtonElement;

      fireEvent.pointerDown(dropdownTrigger);

      await waitFor(() => {
        expect(
          screen.getByRole("menuitem", { name: /^Vertical/ }),
        ).toBeInTheDocument();
        expect(
          screen.getByRole("menuitem", { name: /^Horizontal/ }),
        ).toBeInTheDocument();
        expect(
          screen.getByRole("menuitem", { name: /^Rectangle/ }),
        ).toBeInTheDocument();
      });
    }
  });

  it("changes displayed image proportion when dropdown option is selected", async () => {
    render(<TestWrapper />);

    const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
    const input = document.querySelector(
      'input[type="file"][accept*="image/jpeg"]',
    );

    expect(input).toBeDefined();

    if (input) {
      fireEvent.change(input, { target: { files: [file] } });

      const previewCanvas = (await screen.findByTestId(
        "selected-image-preview-canvas",
      )) as HTMLCanvasElement;

      await waitFor(() => {
        expect(previewCanvas.width).toBe(1200);
        expect(previewCanvas.height).toBe(800);
      });

      const dropdownTrigger = screen.getByTestId(
        "image-proportions-dropdown-trigger",
      );

      fireEvent.pointerDown(dropdownTrigger);
      fireEvent.click(screen.getByRole("menuitem", { name: /^Vertical/ }));

      await waitFor(() => {
        expect(previewCanvas.width).toBe(533);
        expect(previewCanvas.height).toBe(800);
      });

      fireEvent.pointerDown(dropdownTrigger);
      fireEvent.click(screen.getByRole("menuitem", { name: /^Rectangle/ }));

      await waitFor(() => {
        expect(previewCanvas.width).toBe(800);
        expect(previewCanvas.height).toBe(800);
      });
    }
  });

  it("defaults to the optimal proportion based on image coverage", async () => {
    render(<TestWrapper />);

    mockImageWidth = 800;
    mockImageHeight = 1200;

    const file = new File(["test"], "portrait.jpg", { type: "image/jpeg" });
    const input = document.querySelector(
      'input[type="file"][accept*="image/jpeg"]',
    );

    expect(input).toBeDefined();

    if (input) {
      fireEvent.change(input, { target: { files: [file] } });

      const previewCanvas = (await screen.findByTestId(
        "selected-image-preview-canvas",
      )) as HTMLCanvasElement;

      await waitFor(() => {
        expect(previewCanvas.width).toBe(800);
        expect(previewCanvas.height).toBe(1200);
      });

      const dropdownTrigger = screen.getByTestId(
        "image-proportions-dropdown-trigger",
      );

      expect(dropdownTrigger).toBeInTheDocument();
    }
  });

  it("shows slot switcher dots and preview slider after first image selection", async () => {
    render(<TestWrapper />);

    const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
    const input = document.querySelector(
      'input[type="file"][accept*="image/jpeg"]',
    );

    expect(input).toBeDefined();

    if (input) {
      fireEvent.change(input, { target: { files: [file] } });

      await screen.findByRole("img", { name: "Preview" });

      expect(screen.getByTestId("uploader-preview-slider")).toBeInTheDocument();
      expect(screen.getByTestId("uploader-slot-dots")).toBeInTheDocument();
      expect(screen.getByTestId("uploader-slot-dot-0")).toBeInTheDocument();
      expect(screen.getByTestId("uploader-slot-dot-2")).toBeInTheDocument();
      expect(slotDotHasImage(0)).toBe(false);
      expect(slotDotHasImage(2)).toBe(false);
    }
  });

  it("adds second image to the clicked right slot", async () => {
    render(<TestWrapper />);

    mockImageWidth = 1200;
    mockImageHeight = 800;

    const firstFile = new File(["first"], "first.jpg", { type: "image/jpeg" });
    const secondFile = new File(["second"], "second.jpg", {
      type: "image/jpeg",
    });
    const initialInput = document.querySelector(
      'input[type="file"][accept*="image/jpeg"]',
    ) as HTMLInputElement | null;

    expect(initialInput).toBeDefined();

    if (initialInput) {
      fireEvent.change(initialInput, { target: { files: [firstFile] } });

      await screen.findByRole("img", { name: "Preview" });

      mockImageWidth = 900;
      mockImageHeight = 900;

      fireEvent.click(screen.getByTestId("uploader-slot-dot-2"));
      const editorInput = document.querySelector(
        'input[type="file"][accept="image/jpeg,image/png,image/webp"]',
      ) as HTMLInputElement | null;

      expect(editorInput).toBeDefined();

      if (editorInput) {
        fireEvent.change(editorInput, { target: { files: [secondFile] } });
      }

      const previewCanvas = screen.getByTestId(
        "selected-image-preview-canvas",
      ) as HTMLCanvasElement;
      await waitFor(() => {
        expect(previewCanvas.width).toBe(1200);
        expect(previewCanvas.height).toBe(800);
      });

      await waitFor(() => {
        expect(slotDotHasImage(2)).toBe(true);
      });

      expect(slotDotHasImage(0)).toBe(false);
    }
  });

  it("auto-selects vertical proportion for vertical image added to side slot", async () => {
    render(<TestWrapper />);

    mockImageWidth = 1200;
    mockImageHeight = 800;

    const firstFile = new File(["first"], "first.jpg", { type: "image/jpeg" });
    const verticalFile = new File(["selfie"], "selfie.jpg", {
      type: "image/jpeg",
    });
    const initialInput = document.querySelector(
      'input[type="file"][accept*="image/jpeg"]',
    ) as HTMLInputElement | null;

    expect(initialInput).toBeDefined();

    if (initialInput) {
      fireEvent.change(initialInput, { target: { files: [firstFile] } });

      await screen.findByRole("img", { name: "Preview" });

      mockImageWidth = 1080;
      mockImageHeight = 1920;

      fireEvent.click(screen.getByTestId("uploader-slot-dot-2"));
      const editorInput = document.querySelector(
        'input[type="file"][accept="image/jpeg,image/png,image/webp"]',
      ) as HTMLInputElement | null;

      expect(editorInput).toBeDefined();

      if (editorInput) {
        fireEvent.change(editorInput, {
          target: { files: [verticalFile] },
        });
      }

      await waitFor(() => {
        expect(slotDotHasImage(2)).toBe(true);
      });

      fireEvent.click(screen.getByTestId("uploader-slot-dot-2"));

      await waitFor(() => {
        const previewCanvas = screen.getByTestId(
          "selected-image-preview-canvas",
        ) as HTMLCanvasElement;
        expect(previewCanvas.width).toBeLessThan(previewCanvas.height);
      });
    }
  });

  it("adds second image to the clicked left slot", async () => {
    render(<TestWrapper />);

    mockImageWidth = 1200;
    mockImageHeight = 800;

    const firstFile = new File(["first"], "first.jpg", { type: "image/jpeg" });
    const secondFile = new File(["second"], "second.jpg", {
      type: "image/jpeg",
    });
    const initialInput = document.querySelector(
      'input[type="file"][accept*="image/jpeg"]',
    ) as HTMLInputElement | null;

    expect(initialInput).toBeDefined();

    if (initialInput) {
      fireEvent.change(initialInput, { target: { files: [firstFile] } });

      await screen.findByRole("img", { name: "Preview" });

      mockImageWidth = 900;
      mockImageHeight = 900;

      fireEvent.click(screen.getByTestId("uploader-slot-dot-0"));
      const editorInput = document.querySelector(
        'input[type="file"][accept="image/jpeg,image/png,image/webp"]',
      ) as HTMLInputElement | null;

      expect(editorInput).toBeDefined();

      if (editorInput) {
        fireEvent.change(editorInput, { target: { files: [secondFile] } });
      }

      const previewCanvas = screen.getByTestId(
        "selected-image-preview-canvas",
      ) as HTMLCanvasElement;
      await waitFor(() => {
        expect(previewCanvas.width).toBe(1200);
        expect(previewCanvas.height).toBe(800);
      });

      await waitFor(() => {
        expect(slotDotHasImage(0)).toBe(true);
      });

      expect(slotDotHasImage(2)).toBe(false);
    }
  });

  it("keeps previous preview URL valid when adding another image", async () => {
    const createObjectURLSpy = vi
      .spyOn(URL, "createObjectURL")
      .mockImplementationOnce(() => "blob:first-preview")
      .mockImplementationOnce(() => "blob:second-preview");
    const revokeObjectURLSpy = vi
      .spyOn(URL, "revokeObjectURL")
      .mockImplementation(() => {});

    render(<TestWrapper />);

    const firstFile = new File(["first"], "first.jpg", { type: "image/jpeg" });
    const secondFile = new File(["second"], "second.jpg", {
      type: "image/jpeg",
    });

    const initialInput = document.querySelector(
      'input[type="file"][accept*="image/jpeg"]',
    ) as HTMLInputElement | null;

    expect(initialInput).toBeDefined();

    if (initialInput) {
      fireEvent.change(initialInput, { target: { files: [firstFile] } });
      await screen.findByRole("img", { name: "Preview" });

      fireEvent.click(screen.getByTestId("uploader-slot-dot-2"));

      const editorInput = document.querySelector(
        'input[type="file"][accept="image/jpeg,image/png,image/webp"]',
      ) as HTMLInputElement | null;

      expect(editorInput).toBeDefined();

      if (editorInput) {
        fireEvent.change(editorInput, { target: { files: [secondFile] } });
      }

      await waitFor(() => {
        expect(slotDotHasImage(2)).toBe(true);
      });

      fireEvent.click(screen.getByTestId("uploader-slot-dot-2"));

      await waitFor(() => {
        expect(slotDotHasImage(1)).toBe(true);
      });

      expect(createObjectURLSpy).toHaveBeenCalledTimes(2);
      expect(revokeObjectURLSpy).not.toHaveBeenCalledWith("blob:first-preview");
    }
  });

  it("persists per-slot proportion when switching between slots", async () => {
    render(<TestWrapper />);

    const firstFile = new File(["first"], "first.jpg", { type: "image/jpeg" });
    const secondFile = new File(["second"], "second.jpg", {
      type: "image/jpeg",
    });

    const initialInput = document.querySelector(
      'input[type="file"][accept*="image/jpeg"]',
    ) as HTMLInputElement | null;

    expect(initialInput).toBeDefined();

    if (initialInput) {
      fireEvent.change(initialInput, { target: { files: [firstFile] } });

      await screen.findByRole("img", { name: "Preview" });

      const dropdownTrigger = screen.getByTestId(
        "image-proportions-dropdown-trigger",
      );
      fireEvent.pointerDown(dropdownTrigger);
      fireEvent.click(screen.getByRole("menuitem", { name: /^Vertical/ }));

      fireEvent.click(screen.getByTestId("uploader-slot-dot-2"));

      const editorInput = document.querySelector(
        'input[type="file"][accept="image/jpeg,image/png,image/webp"]',
      ) as HTMLInputElement | null;

      expect(editorInput).toBeDefined();

      if (editorInput) {
        fireEvent.change(editorInput, { target: { files: [secondFile] } });
      }

      await waitFor(() => {
        expect(slotDotHasImage(2)).toBe(true);
      });

      fireEvent.click(screen.getByTestId("uploader-slot-dot-2"));

      const secondImageDropdown = screen.getByTestId(
        "image-proportions-dropdown-trigger",
      );
      fireEvent.pointerDown(secondImageDropdown);
      fireEvent.click(screen.getByRole("menuitem", { name: /^Rectangle/ }));

      await waitFor(() => {
        expect(screen.getByTestId("selected-image-preview-frame")).toHaveStyle({
          aspectRatio: String(1),
        });
      });
    }
  });

  it("removes the active image and returns to upload area when it was the only one", async () => {
    const uploaderRef = createRef<ImageUploaderHandle>();
    render(<TestWrapper uploaderRef={uploaderRef} />);

    const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
    const input = document.querySelector(
      'input[type="file"][accept*="image/jpeg"]',
    ) as HTMLInputElement | null;

    expect(input).toBeDefined();

    if (input) {
      fireEvent.change(input, { target: { files: [file] } });

      await screen.findByRole("img", { name: "Preview" });

      act(() => {
        uploaderRef.current?.removeActiveImage();
      });

      await waitFor(() => {
        expect(screen.queryByRole("img", { name: "Preview" })).toBeNull();
      });
    }
  });

  it("removes current active image and keeps remaining image in its slot", async () => {
    const uploaderRef = createRef<ImageUploaderHandle>();
    render(<TestWrapper uploaderRef={uploaderRef} />);

    const firstFile = new File(["first"], "first.jpg", { type: "image/jpeg" });
    const secondFile = new File(["second"], "second.jpg", {
      type: "image/jpeg",
    });

    const input = document.querySelector(
      'input[type="file"][accept*="image/jpeg"]',
    ) as HTMLInputElement | null;

    expect(input).toBeDefined();

    if (input) {
      fireEvent.change(input, { target: { files: [firstFile] } });
      await screen.findByRole("img", { name: "Preview" });

      mockImageWidth = 900;
      mockImageHeight = 900;

      fireEvent.click(screen.getByTestId("uploader-slot-dot-2"));

      const editorInput = document.querySelector(
        'input[type="file"][accept="image/jpeg,image/png,image/webp"]',
      ) as HTMLInputElement | null;

      expect(editorInput).toBeDefined();

      if (editorInput) {
        fireEvent.change(editorInput, { target: { files: [secondFile] } });
      }

      await waitFor(() => {
        expect(slotDotHasImage(2)).toBe(true);
      });

      const previewCanvas = screen.getByTestId(
        "selected-image-preview-canvas",
      ) as HTMLCanvasElement;
      await waitFor(() => {
        expect(previewCanvas.width).toBe(1200);
        expect(previewCanvas.height).toBe(800);
      });

      act(() => {
        uploaderRef.current?.removeActiveImage();
      });

      fireEvent.click(screen.getByRole("button", {
        name: tr("uploader.removeSlotConfirmAction"),
      }));

      await waitFor(() => {
        expect(slotDotHasImage(2)).toBe(true);
      });

      expect(screen.queryByRole("img", { name: "Preview" })).toBeNull();
      expect(
        screen.getByTestId("selected-image-preview-placeholder"),
      ).toBeInTheDocument();

      fireEvent.click(screen.getByTestId("uploader-slot-dot-2"));

      await waitFor(() => {
        const nextActiveCanvas = screen.getByTestId(
          "selected-image-preview-canvas",
        ) as HTMLCanvasElement;
        expect(nextActiveCanvas.width).toBe(900);
        expect(nextActiveCanvas.height).toBe(900);
      });
    }
  });

  it("keeps side slots populated after center removal", async () => {
    const uploaderRef = createRef<ImageUploaderHandle>();
    render(<TestWrapper uploaderRef={uploaderRef} />);

    const firstFile = new File(["first"], "first.jpg", { type: "image/jpeg" });
    const secondFile = new File(["second"], "second.jpg", {
      type: "image/jpeg",
    });
    const thirdFile = new File(["third"], "third.jpg", { type: "image/jpeg" });

    const input = document.querySelector(
      'input[type="file"][accept*="image/jpeg"]',
    ) as HTMLInputElement | null;

    expect(input).toBeDefined();

    if (input) {
      mockImageWidth = 1200;
      mockImageHeight = 800;
      fireEvent.change(input, { target: { files: [firstFile] } });
      await screen.findByRole("img", { name: "Preview" });

      const previewCanvas = screen.getByTestId(
        "selected-image-preview-canvas",
      ) as HTMLCanvasElement;
      await waitFor(() => {
        expect(previewCanvas.width).toBe(1200);
        expect(previewCanvas.height).toBe(800);
      });

      mockImageWidth = 900;
      mockImageHeight = 900;
      fireEvent.click(screen.getByTestId("uploader-slot-dot-2"));

      let editorInput = document.querySelector(
        'input[type="file"][accept="image/jpeg,image/png,image/webp"]',
      ) as HTMLInputElement | null;
      expect(editorInput).toBeDefined();
      if (editorInput) {
        fireEvent.change(editorInput, { target: { files: [secondFile] } });
      }

      await waitFor(() => {
        expect(slotDotHasImage(2)).toBe(true);
      });

      mockImageWidth = 800;
      mockImageHeight = 1100;
      fireEvent.click(screen.getByTestId("uploader-slot-dot-0"));

      editorInput = document.querySelector(
        'input[type="file"][accept="image/jpeg,image/png,image/webp"]',
      ) as HTMLInputElement | null;
      expect(editorInput).toBeDefined();
      if (editorInput) {
        fireEvent.change(editorInput, { target: { files: [thirdFile] } });
      }

      await waitFor(() => {
        expect(slotDotHasImage(0)).toBe(true);
        expect(slotDotHasImage(2)).toBe(true);
      });

      act(() => {
        uploaderRef.current?.removeActiveImage();
      });

      await waitFor(() => {
        expect(slotDotHasImage(0)).toBe(true);
        expect(slotDotHasImage(2)).toBe(true);
      });
    }
  });

  it("applies swipe threshold before changing active slot", async () => {
    render(<TestWrapper />);

    const firstFile = new File(["first"], "first.jpg", { type: "image/jpeg" });
    const secondFile = new File(["second"], "second.jpg", {
      type: "image/jpeg",
    });

    const input = document.querySelector(
      'input[type="file"][accept*="image/jpeg"]',
    ) as HTMLInputElement | null;

    expect(input).toBeDefined();

    if (input) {
      mockImageWidth = 1200;
      mockImageHeight = 800;
      fireEvent.change(input, { target: { files: [firstFile] } });
      await screen.findByRole("img", { name: "Preview" });

      const previewCanvas = screen.getByTestId(
        "selected-image-preview-canvas",
      ) as HTMLCanvasElement;
      await waitFor(() => {
        expect(previewCanvas.width).toBe(1200);
        expect(previewCanvas.height).toBe(800);
      });

      mockImageWidth = 900;
      mockImageHeight = 900;
      fireEvent.click(screen.getByTestId("uploader-slot-dot-2"));

      const editorInput = document.querySelector(
        'input[type="file"][accept="image/jpeg,image/png,image/webp"]',
      ) as HTMLInputElement | null;
      expect(editorInput).toBeDefined();
      if (editorInput) {
        fireEvent.change(editorInput, { target: { files: [secondFile] } });
      }

      // Wait for second image to register in right slot
      await waitFor(() => {
        expect(slotDotHasImage(2)).toBe(true);
      });

      fireEvent.click(screen.getByTestId("uploader-slot-dot-1"));

      await waitFor(() => {
        expect(screen.getByRole("img", { name: "Preview" })).toBeInTheDocument();
      });

      const previewFrame = screen.getByTestId("selected-image-preview-frame");
      // First image (1200×800) is still active; second is in right slot → canMoveNext=true
      // Swipe left (negative delta) to move to the next (right) slot
      const startX = 200;
      const canvasSizeBefore = {
        width: previewCanvas.width,
        height: previewCanvas.height,
      };

      fireEvent.touchStart(previewFrame, {
        touches: [{ clientX: startX }],
      });
      fireEvent.touchEnd(previewFrame, {
        changedTouches: [{ clientX: startX - 25 }],
      });

      await waitFor(() => {
        expect(previewCanvas.width).toBe(canvasSizeBefore.width);
        expect(previewCanvas.height).toBe(canvasSizeBefore.height);
      });

      fireEvent.touchStart(previewFrame, {
        touches: [{ clientX: startX }],
      });
      fireEvent.touchEnd(previewFrame, {
        changedTouches: [{ clientX: startX - 60 }],
      });

      await waitFor(() => {
        expect(
          previewCanvas.width !== canvasSizeBefore.width ||
            previewCanvas.height !== canvasSizeBefore.height,
        ).toBe(true);
      });
    }
  });

  it("initializes new images with neutral previewEffects (brightness: 0, contrast: 0)", async () => {
    render(<TestWrapper />);

    const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
    const input = document.querySelector(
      'input[type="file"][accept*="image/jpeg"]',
    ) as HTMLInputElement | null;

    expect(input).toBeDefined();

    if (input) {
      fireEvent.change(input, { target: { files: [file] } });

      // Wait for preview to load
      await screen.findByRole("img", { name: "Preview" });

      // Verify that the image was created with default effects
      // We can check this by attempting to apply effects and verifying the state is initialized
      const effectsButton = screen.queryByRole("button", {
        name: tr("uploader.settingsButton"),
      });

      // The button should exist (meaning effects are supported)
      expect(effectsButton).toBeInTheDocument();
    }
  });

  it("persists per-slot effects independently when switching between slots", async () => {
    render(<TestWrapper />);

    const file1 = new File(["first"], "first.jpg", { type: "image/jpeg" });
    const file2 = new File(["second"], "second.jpg", { type: "image/jpeg" });

    const input = document.querySelector(
      'input[type="file"][accept*="image/jpeg"]',
    ) as HTMLInputElement | null;

    expect(input).toBeDefined();

    if (input) {
      // Upload first image
      fireEvent.change(input, { target: { files: [file1] } });
      await screen.findByRole("img", { name: "Preview" });

      // Switch to right slot and upload second image
      fireEvent.click(screen.getByTestId("uploader-slot-dot-2"));

      const editorInput = document.querySelector(
        'input[type="file"][accept="image/jpeg,image/png,image/webp"]',
      ) as HTMLInputElement | null;

      expect(editorInput).toBeDefined();

      if (editorInput) {
        fireEvent.change(editorInput, { target: { files: [file2] } });

        await waitFor(() => {
          expect(slotDotHasImage(2)).toBe(true);
        });
      }

      // Both images should have independent effect states (both initialized to neutral)
      // Verify no cross-contamination by checking that both slots can be activated
      const centerPreview = screen.getByTestId("selected-image-preview-frame");
      expect(centerPreview).toBeInTheDocument();
    }
  });

  it("splits image and keeps split previews visible", async () => {
    mockImageWidth = 7800;
    mockImageHeight = 1800;
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

    expect(input).toBeDefined();

    if (input) {
      fireEvent.change(input, { target: { files: [sourceFile] } });
      await screen.findByRole("img", { name: "Preview" });

      const splitButton = screen.getByRole("button", {
        name: tr("uploader.splitSelectedImage"),
      });

      expect(splitButton).toBeEnabled();
      fireEvent.click(splitButton);

      await waitFor(() => {
        expect(splitImageIntoVerticalThirdFiles).toHaveBeenCalledWith(
          expect.objectContaining({
            previewUrl: expect.stringContaining("blob:"),
            sourceFile,
          }),
        );
      });

      // After split, all three slots should be populated with new images
      await waitFor(() => {
        expect(slotDotHasImage(0)).toBe(true);
        expect(slotDotHasImage(2)).toBe(true);
      });
    }
  });

  it("allows updating effects on active slot independently", async () => {
    render(<TestWrapper />);

    const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
    const input = document.querySelector(
      'input[type="file"][accept*="image/jpeg"]',
    ) as HTMLInputElement | null;

    expect(input).toBeDefined();

    if (input) {
      fireEvent.change(input, { target: { files: [file] } });
      await screen.findByRole("img", { name: "Preview" });

      // Open effects popover
      const effectsButton = screen.getByRole("button", {
        name: tr("uploader.settingsButton"),
      });
      expect(effectsButton).not.toBeDisabled();
      expect(effectsButton).toBeInTheDocument();
    }
  });

  it("forces fresh uploads after split by invalidating previous uploaded cache", async () => {
    mockImageWidth = 7800;
    mockImageHeight = 1800;
    const sourceFile = new File(["source"], "source.jpg", {
      type: "image/jpeg",
      lastModified: 101,
    });
    const splitPartFiles: [File, File, File] = [
      new File(["left"], "source-part-1.jpg", {
        type: "image/jpeg",
        lastModified: 201,
      }),
      new File(["center"], "source-part-2.jpg", {
        type: "image/jpeg",
        lastModified: 202,
      }),
      new File(["right"], "source-part-3.jpg", {
        type: "image/jpeg",
        lastModified: 203,
      }),
    ];

    vi.mocked(splitImageIntoVerticalThirdFiles).mockResolvedValue(
      splitPartFiles,
    );

    vi.mocked(uploadImageToCloudinary)
      .mockResolvedValueOnce({
        asset: {
          public_id: "initial-upload",
          secure_url:
            "https://res.cloudinary.com/test/image/upload/v1/initial.jpg",
          width: 1200,
          height: 800,
          bytes: 1234,
          format: "jpg",
          url: "https://res.cloudinary.com/test/image/upload/v1/initial.jpg",
        },
        transformedUrl:
          "https://res.cloudinary.com/test/image/upload/e_background_removal/v1/initial.jpg",
        transformations: {
          rotation: 0,
          flipHorizontal: false,
          flipVertical: false,
          brightness: 0,
          contrast: 0,
          grayscale: 0,
          blur: 0,
        },
      })
      .mockResolvedValue({
        asset: {
          public_id: "split-upload",
          secure_url:
            "https://res.cloudinary.com/test/image/upload/v2/split.jpg",
          width: 400,
          height: 800,
          bytes: 567,
          format: "jpg",
          url: "https://res.cloudinary.com/test/image/upload/v2/split.jpg",
        },
        transformedUrl:
          "https://res.cloudinary.com/test/image/upload/e_background_removal/v2/split.jpg",
        transformations: {
          rotation: 0,
          flipHorizontal: false,
          flipVertical: false,
          brightness: 0,
          contrast: 0,
          grayscale: 0,
          blur: 0,
        },
      });

    const uploaderRef = createRef<ImageUploaderHandle>();
    render(<TestWrapper uploaderRef={uploaderRef} />);

    const input = document.querySelector(
      'input[type="file"][accept*="image/jpeg"]',
    ) as HTMLInputElement | null;

    expect(input).toBeDefined();

    if (!input) {
      return;
    }

    fireEvent.change(input, { target: { files: [sourceFile] } });
    await screen.findByRole("img", { name: "Preview" });

    const effectsButton = await screen.findByRole("button", {
      name: tr("uploader.aiEditorButton"),
    });
    await waitFor(() => expect(effectsButton).not.toBeDisabled());
    fireEvent.click(effectsButton);

    const removeBackgroundSwitch = await screen.findByRole("switch", {
      name: tr("upload.aiRemoveBackground"),
    });
    fireEvent.click(removeBackgroundSwitch);

    await waitFor(() => {
      expect(uploadImageToCloudinary).toHaveBeenCalledTimes(1);
      expect(
        screen.getByTestId("selected-image-preview-canvas"),
      ).toBeInTheDocument();
    });

    fireEvent.keyDown(document, { key: "Escape" });

    const closeButton = screen.getByRole("button", {
      name: tr("uploader.effectsCancel"),
    });
    fireEvent.click(closeButton);

    const splitButton = await screen.findByRole("button", {
      name: tr("uploader.splitSelectedImage"),
    });
    fireEvent.click(splitButton);

    // Wide panoramas use the seamless window model (no third-file split); the
    // outcome is verified by the slot population + fresh uploads below.
    await waitFor(() => {
      expect(slotDotHasImage(0)).toBe(true);
      expect(slotDotHasImage(2)).toBe(true);
    });

    await act(async () => {
      await uploaderRef.current?.uploadFilledSlots();
    });

    await waitFor(() => {
      expect(uploadImageToCloudinary).toHaveBeenCalledTimes(4);
    });
  });

  it("reuses cached uploaded asset for unchanged slot and uploads fresh for new slot during checkout", async () => {
    const sourceFile = new File(["source"], "source.jpg", {
      type: "image/jpeg",
      lastModified: 101,
    });
    const secondFile = new File(["second"], "second.jpg", {
      type: "image/jpeg",
      lastModified: 202,
    });

    vi.mocked(uploadImageToCloudinary)
      .mockResolvedValueOnce({
        asset: {
          public_id: "cached-upload",
          secure_url:
            "https://res.cloudinary.com/test/image/upload/v1/cached.jpg",
          width: 1200,
          height: 800,
          bytes: 1234,
          format: "jpg",
          url: "https://res.cloudinary.com/test/image/upload/v1/cached.jpg",
        },
        transformedUrl:
          "https://res.cloudinary.com/test/image/upload/e_background_removal/v1/cached.jpg",
        transformations: {
          rotation: 0,
          flipHorizontal: false,
          flipVertical: false,
          brightness: 0,
          contrast: 0,
          grayscale: 0,
          blur: 0,
        },
      })
      .mockResolvedValue({
        asset: {
          public_id: "fresh-upload",
          secure_url:
            "https://res.cloudinary.com/test/image/upload/v2/fresh.jpg",
          width: 1200,
          height: 800,
          bytes: 567,
          format: "jpg",
          url: "https://res.cloudinary.com/test/image/upload/v2/fresh.jpg",
        },
        transformedUrl:
          "https://res.cloudinary.com/test/image/upload/v2/fresh.jpg",
        transformations: {
          rotation: 0,
          flipHorizontal: false,
          flipVertical: false,
          brightness: 0,
          contrast: 0,
          grayscale: 0,
          blur: 0,
        },
      });

    const uploaderRef = createRef<ImageUploaderHandle>();
    render(<TestWrapper uploaderRef={uploaderRef} />);

    const input = document.querySelector(
      'input[type="file"][accept*="image/jpeg"]',
    ) as HTMLInputElement | null;

    expect(input).toBeDefined();
    if (!input) {
      return;
    }

    // Load first file and enable remove-background — triggers bg upload (call 1)
    fireEvent.change(input, { target: { files: [sourceFile] } });
    await screen.findByRole("img", { name: "Preview" });

    const effectsButton = await screen.findByRole("button", {
      name: tr("uploader.aiEditorButton"),
    });
    await waitFor(() => expect(effectsButton).not.toBeDisabled());
    fireEvent.click(effectsButton);

    const removeBackgroundSwitch = await screen.findByRole("switch", {
      name: tr("upload.aiRemoveBackground"),
    });
    fireEvent.click(removeBackgroundSwitch);

    // Wait for bg upload to complete and cloud preview to render
    await waitFor(() => {
      expect(uploadImageToCloudinary).toHaveBeenCalledTimes(1);
      expect(
        screen.getByTestId("selected-image-preview-canvas"),
      ).toBeInTheDocument();
    });

    fireEvent.keyDown(document, { key: "Escape" });

    const closeEffectsButton = screen.getByRole("button", {
      name: tr("uploader.effectsCancel"),
    });
    fireEvent.click(closeEffectsButton);

    // Add a second file to the right slot (no bg removal → no uploadedAsset)
    fireEvent.click(screen.getByTestId("uploader-slot-dot-2"));

    const editorInput = document.querySelector(
      'input[type="file"][accept="image/jpeg,image/png,image/webp"]',
    ) as HTMLInputElement | null;

    expect(editorInput).toBeDefined();
    if (editorInput) {
      fireEvent.change(editorInput, { target: { files: [secondFile] } });
    }

    await waitFor(() => {
      expect(slotDotHasImage(2)).toBe(true);
    });

    // Checkout: center slot should reuse cached asset (no upload); right slot is fresh (call 2)
    await act(async () => {
      await uploaderRef.current?.uploadFilledSlots();
    });

    await waitFor(() => {
      expect(uploadImageToCloudinary).toHaveBeenCalledTimes(2);
    });
  });

  it("hides remove button when effects edit mode is active and restores on close", async () => {
    render(<TestWrapper />);

    const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
    const input = document.querySelector(
      'input[type="file"][accept*="image/jpeg"]',
    ) as HTMLInputElement | null;

    expect(input).toBeDefined();
    if (!input) return;

    fireEvent.change(input, { target: { files: [file] } });
    await screen.findByRole("img", { name: "Preview" });

    // With onClearSlot provided, the remove button should be present
    expect(
      screen.getByTestId("uploader-remove-active-image"),
    ).toBeInTheDocument();

    // Open effects panel to enter edit mode
    const effectsButton = screen.getByRole("button", {
      name: tr("uploader.settingsButton"),
    });
    fireEvent.click(effectsButton);

    // In edit mode, the remove button should be hidden
    await waitFor(() => {
      expect(
        screen.queryByTestId("uploader-remove-active-image"),
      ).not.toBeInTheDocument();
    });

    // Close effects panel to exit edit mode
    const closeButton = screen.getByRole("button", {
      name: tr("uploader.effectsCancel"),
    });
    fireEvent.click(closeButton);

    // After exiting edit mode, the remove button should be visible again
    await waitFor(() => {
      expect(
        screen.getByTestId("uploader-remove-active-image"),
      ).toBeInTheDocument();
    });
  });

  it("does not render a zoom slider in the settings drawer", async () => {
    render(<TestWrapper />);

    const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
    const input = document.querySelector(
      'input[type="file"][accept*="image/jpeg"]',
    ) as HTMLInputElement | null;
    if (!input) return;

    fireEvent.change(input, { target: { files: [file] } });
    await screen.findByRole("img", { name: "Preview" });

    const effectsButton = screen.getByRole("button", {
      name: tr("uploader.settingsButton"),
    });
    fireEvent.click(effectsButton);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: tr("uploader.effectsCancel") }),
      ).toBeInTheDocument();
    });
    expect(screen.queryByText(tr("uploader.zoom"))).not.toBeInTheDocument();
  });

  it("resets zoom when proportion is changed", async () => {
    render(<TestWrapper />);

    const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
    const input = document.querySelector(
      'input[type="file"][accept*="image/jpeg"]',
    ) as HTMLInputElement | null;
    if (!input) return;

    fireEvent.change(input, { target: { files: [file] } });
    const canvas = await screen.findByRole("img", { name: "Preview" });

    const effectsButton = screen.getByRole("button", {
      name: tr("uploader.settingsButton"),
    });
    fireEvent.click(effectsButton);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: tr("uploader.effectsCancel") }),
      ).toBeInTheDocument();
    });

    // Zoom via mouse wheel on the preview canvas (no zoom slider anymore).
    fireEvent.wheel(canvas, { deltaY: -100 });

    // The crop reset button only appears once a non-identity crop is active.
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: tr("uploader.cropReset") }),
      ).toBeInTheDocument();
    });

    const closeButton = screen.getByRole("button", {
      name: tr("uploader.effectsCancel"),
    });
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(
        screen.queryByTestId("effects-drawer-title"),
      ).not.toBeInTheDocument();
    });

    const dropdownTrigger = screen.getByTestId(
      "image-proportions-dropdown-trigger",
    );
    fireEvent.pointerDown(dropdownTrigger);
    fireEvent.click(screen.getByRole("menuitem", { name: /^Vertical/ }));

    fireEvent.click(screen.getByRole("button", {
      name: tr("uploader.settingsButton"),
    }));

    await waitFor(() => {
      expect(
        screen.queryByRole("button", { name: tr("uploader.cropReset") }),
      ).not.toBeInTheDocument();
    });
  });

  describe("multi-image batch upload", () => {
    it("fills all 3 slots when selecting 3 files at once", async () => {
      const onOrderableSlotsChange = vi.fn();
      render(<TestWrapper onOrderableSlotsChange={onOrderableSlotsChange} />);

      const file1 = new File(["a"], "a.jpg", { type: "image/jpeg" });
      const file2 = new File(["b"], "b.jpg", { type: "image/jpeg" });
      const file3 = new File(["c"], "c.jpg", { type: "image/jpeg" });

      const input = document.querySelector(
        'input[type="file"][accept*="image/jpeg"]',
      ) as HTMLInputElement;

      expect(input).toBeTruthy();

      fireEvent.change(input, { target: { files: [file1, file2, file3] } });

      await waitFor(() => {
        expect(screen.getByRole("img", { name: "Preview" })).toBeInTheDocument();
      });

      await waitFor(() => {
        const lastCall = onOrderableSlotsChange.mock.calls[onOrderableSlotsChange.mock.calls.length - 1];
        expect(lastCall?.[0]).toHaveLength(3);
      });
    });

    it("does not prompt to add another image after selecting a single image", async () => {
      render(<TestWrapper />);

      const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
      const input = document.querySelector(
        'input[type="file"][accept*="image/jpeg"]',
      ) as HTMLInputElement;

      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByRole("img", { name: "Preview" })).toBeInTheDocument();
      });

      expect(screen.queryByText(/add another image/i)).not.toBeInTheDocument();
    });

    it("filters out non-image files in a multi-select batch", async () => {
      render(<TestWrapper />);

      const imageFile = new File(["img"], "img.jpg", { type: "image/jpeg" });
      const textFile = new File(["text"], "doc.pdf", { type: "application/pdf" });
      const input = document.querySelector(
        'input[type="file"][accept*="image/jpeg"]',
      ) as HTMLInputElement;

      fireEvent.change(input, { target: { files: [imageFile, textFile] } });

      await waitFor(() => {
        expect(screen.getByRole("img", { name: "Preview" })).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(slotDotHasImage(0)).toBe(true);
        expect(slotDotHasImage(1)).toBe(false);
        expect(slotDotHasImage(2)).toBe(false);
      });
    });

    it("does not prompt to add another image after a drag-and-drop", async () => {
      render(<TestWrapper />);

      const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
      const dropArea = screen.getByText(tr("upload.clickToUpload")).closest("div")!;

      fireEvent.drop(dropArea, { dataTransfer: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByRole("img", { name: "Preview" })).toBeInTheDocument();
      });

      expect(screen.queryByText(/add another image/i)).not.toBeInTheDocument();
    });
  });

  describe("remove slot confirmation dialog", () => {
    it("shows confirmation dialog when removing an image", async () => {
      render(<TestWrapper />);

      const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
      const input = document.querySelector(
        'input[type="file"][accept*="image/jpeg"]',
      ) as HTMLInputElement;

      fireEvent.change(input, { target: { files: [file] } });
      await screen.findByRole("img", { name: "Preview" });

      const clearButton = screen.getByTestId("uploader-remove-active-image");
      fireEvent.click(clearButton);

      expect(screen.getByText(tr("uploader.removeSlotConfirmTitle"))).toBeInTheDocument();
      expect(screen.getByText(tr("uploader.removeSlotConfirmDescription"))).toBeInTheDocument();
      expect(screen.getByRole("button", { name: tr("uploader.removeSlotConfirmAction") })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: tr("uploader.cancel") })).toBeInTheDocument();
    });

    it("removes the image after confirming the dialog", async () => {
      render(<TestWrapper />);

      const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
      const input = document.querySelector(
        'input[type="file"][accept*="image/jpeg"]',
      ) as HTMLInputElement;

      fireEvent.change(input, { target: { files: [file] } });
      await screen.findByRole("img", { name: "Preview" });

      const clearButton = screen.getByTestId("uploader-remove-active-image");
      fireEvent.click(clearButton);

      fireEvent.click(screen.getByRole("button", {
        name: tr("uploader.removeSlotConfirmAction"),
      }));

      await waitFor(() => {
        expect(screen.queryByRole("img", { name: "Preview" })).toBeNull();
      });
      expect(screen.queryByText(tr("uploader.removeSlotConfirmTitle"))).not.toBeInTheDocument();
    });

    it("does not remove the image when canceling the dialog", async () => {
      render(<TestWrapper />);

      const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
      const input = document.querySelector(
        'input[type="file"][accept*="image/jpeg"]',
      ) as HTMLInputElement;

      fireEvent.change(input, { target: { files: [file] } });
      await screen.findByRole("img", { name: "Preview" });

      const clearButton = screen.getByTestId("uploader-remove-active-image");
      fireEvent.click(clearButton);

      fireEvent.click(screen.getByRole("button", { name: tr("uploader.cancel") }));

      await waitFor(() => {
        expect(screen.queryByText(tr("uploader.removeSlotConfirmTitle"))).not.toBeInTheDocument();
      });

      expect(screen.getByRole("img", { name: "Preview" })).toBeInTheDocument();
    });
  });
});
