import "fake-indexeddb/auto";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, fireEvent, waitFor, cleanup, screen } from "@testing-library/react";
import { createRef } from "react";
import { ImageUploader, type ImageUploaderHandle } from "./image-uploader";
import {
  clearUploadDraft,
  loadUploadDraft,
  saveUploadDraft,
} from "@/lib/upload-draft-store";
import { t } from "@/locales/i18n";

vi.mock("@/lib/cloudinary-upload", () => ({
  uploadImageToCloudinary: vi.fn(),
}));

vi.mock("./image-uploader/image-file-validator", () => ({
  validateImageFile: vi.fn().mockResolvedValue({
    violations: [],
    dimensions: null,
  }),
}));

function stubImage() {
  vi.stubGlobal(
    "Image",
    class {
      onload: ((ev: Event) => void) | null = null;
      onerror: ((ev: Event) => void) | null = null;
      naturalWidth = 4000;
      naturalHeight = 3000;
      width = 4000;
      height = 3000;

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
}

function selectPhoto() {
  const input = document.querySelector(
    'input[type="file"][accept*="image/jpeg"]',
  ) as HTMLInputElement | null;
  expect(input).not.toBeNull();
  fireEvent.change(input!, {
    target: {
      files: [new File(["source-image"], "photo.jpg", { type: "image/jpeg" })],
    },
  });
}

describe("ImageUploader durable draft", () => {
  beforeEach(async () => {
    await clearUploadDraft();
    stubImage();
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("saves the selected photo and restores it after a full remount", async () => {
    const firstRef = createRef<ImageUploaderHandle>();
    const first = render(<ImageUploader ref={firstRef} />);

    selectPhoto();
    await waitFor(() => expect(firstRef.current?.hasActiveImage()).toBe(true));

    await waitFor(
      async () => {
        const draft = await loadUploadDraft();
        expect(draft?.images).toHaveLength(1);
        expect(draft?.images[0].bytes?.byteLength).toBe(
          "source-image".length,
        );
      },
      { timeout: 4000 },
    );

    first.unmount();

    const secondRef = createRef<ImageUploaderHandle>();
    render(<ImageUploader ref={secondRef} />);

    await waitFor(() => expect(secondRef.current?.hasActiveImage()).toBe(true));
  });

  it("round-trips crop, effects, transform and painting size through the uploader", async () => {
    await saveUploadDraft({
      updatedAt: Date.now(),
      activeImageIndex: 1,
      isTriptychSplit: false,
      isTriptychLinked: true,
      selectedPaintingSizeIndex: 3,
      images: [
        {
          slotIndex: 1,
          bytes: new TextEncoder().encode("photo-bytes").buffer,
          fileName: "photo.jpg",
          fileType: "image/jpeg",
          fileLastModified: 1234,
          metadata: { width: 4000, height: 3000, aspectRatio: "4:3" },
          displayImageProportion: "horizontal",
          previewEffects: {
            brightness: 7,
            contrast: 3,
            grayscale: 0,
            removeBackground: true,
          },
          previewTransform: {
            rotation: 90,
            flipHorizontal: true,
            flipVertical: false,
          },
          previewCropAdjust: { zoom: 1.5, panX: 0.1, panY: -0.2 },
        },
      ],
    });

    const ref = createRef<ImageUploaderHandle>();
    render(<ImageUploader ref={ref} />);

    await waitFor(() => expect(ref.current?.hasActiveImage()).toBe(true));

    await waitFor(
      async () => {
        const draft = await loadUploadDraft();
        const image = draft?.images.find((item) => item.slotIndex === 1);
        expect(image?.previewCropAdjust).toEqual({
          zoom: 1.5,
          panX: 0.1,
          panY: -0.2,
        });
        expect(image?.previewEffects.removeBackground).toBe(true);
        expect(image?.previewEffects.brightness).toBe(7);
        expect(image?.previewTransform).toEqual({
          rotation: 90,
          flipHorizontal: true,
          flipVertical: false,
        });
        expect(draft?.selectedPaintingSizeIndex).toBe(3);
        expect(image?.bytes?.byteLength).toBe("photo-bytes".length);
      },
      { timeout: 4000 },
    );
  });

  it("clears the draft when the uploader is emptied", async () => {
    await saveUploadDraft({
      updatedAt: Date.now(),
      activeImageIndex: 1,
      isTriptychSplit: false,
      isTriptychLinked: true,
      selectedPaintingSizeIndex: 2,
      images: [
        {
          slotIndex: 1,
          bytes: new TextEncoder().encode("photo-bytes").buffer,
          fileName: "photo.jpg",
          fileType: "image/jpeg",
          metadata: { width: 4000, height: 3000, aspectRatio: "4:3" },
          displayImageProportion: "horizontal",
          previewEffects: { brightness: 0, contrast: 0, grayscale: 0 },
        },
      ],
    });

    const ref = createRef<ImageUploaderHandle>();
    render(<ImageUploader ref={ref} />);

    await waitFor(() => expect(ref.current?.hasActiveImage()).toBe(true));

    await waitFor(
      async () => {
        expect(await loadUploadDraft()).not.toBeNull();
      },
      { timeout: 4000 },
    );

    ref.current?.removeActiveImage();

    const confirmButton = await screen.findByRole("button", {
      name: t("uploader.removeSlotConfirmAction"),
    });
    fireEvent.click(confirmButton);

    await waitFor(
      async () => {
        expect(await loadUploadDraft()).toBeNull();
      },
      { timeout: 4000 },
    );
  });
});
