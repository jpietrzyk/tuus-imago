import React, { forwardRef, useImperativeHandle } from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { tr } from "@/test/i18n-test";
import type { UploadResult } from "@/components/cloudinary-upload-widget";
import type { ImageTransformations } from "@/lib/image-transformations";

const mockUploadResult: UploadResult = {
  event: "success",
  info: {
    public_id: "sample",
    secure_url: "https://res.cloudinary.com/demo/image/upload/v123/sample.jpg",
    url: "https://res.cloudinary.com/demo/image/upload/v123/sample.jpg",
    bytes: 1024,
    width: 800,
    height: 600,
    format: "jpg",
    resource_type: "image",
    created_at: new Date().toISOString(),
  },
};

const mockTransformations: ImageTransformations = {
  rotation: 0,
  flipHorizontal: false,
  flipVertical: false,
  brightness: 0,
  contrast: 0,
  grayscale: 0,
  blur: 0,
};

const mockBatchUploadResult = {
  results: [
    {
      slotIndex: 0,
      slotKey: "left" as const,
      transformations: mockTransformations,
      transformedUrl:
        "https://res.cloudinary.com/demo/image/upload/e_brightness:10/v123/left.jpg",
      publicId: "left",
      secureUrl: "https://res.cloudinary.com/demo/image/upload/v123/left.jpg",
    },
    {
      slotIndex: 1,
      slotKey: "center" as const,
      transformations: mockTransformations,
      error: "Network error",
    },
  ],
  successCount: 1,
  failureCount: 1,
  totalCount: 2,
};

let lastImageUploaderProps: { showDebugData?: boolean } | null = null;

vi.mock("@/components/image-uploader", () => ({
  ImageUploader: forwardRef(
    (
      {
        onUploadSuccess,
        onSelectionStateChange,
        showDebugData,
      }: {
        onUploadSuccess?: (
          result: UploadResult,
          transformations: ImageTransformations,
        ) => void;
        onSelectionStateChange?: (hasSelection: boolean) => void;
        showDebugData?: boolean;
      },
      ref: React.ForwardedRef<{
        uploadFilledSlots: () => Promise<typeof mockBatchUploadResult>;
      }>,
    ) => {
      lastImageUploaderProps = { showDebugData };

      useImperativeHandle(ref, () => ({
        uploadFilledSlots: async () => mockBatchUploadResult,
      }));

      return (
        <div>
          <button
            type="button"
            onClick={() =>
              onUploadSuccess?.(mockUploadResult, mockTransformations)
            }
          >
            Mock successful upload
          </button>
          <button type="button" onClick={() => onSelectionStateChange?.(true)}>
            Mock selected slots
          </button>
        </div>
      );
    },
  ),
}));

import { UploadPage } from "./upload";

let isDocumentHidden = false;

const dispatchVisibilityChange = (hidden: boolean) => {
  isDocumentHidden = hidden;
  act(() => {
    document.dispatchEvent(new Event("visibilitychange"));
  });
};

describe("UploadPage preview tabs", () => {
  let originalHiddenDescriptor: PropertyDescriptor | undefined;

  beforeEach(() => {
    vi.useFakeTimers();
    isDocumentHidden = false;
    lastImageUploaderProps = null;

    // Capture the original property descriptor before overriding
    originalHiddenDescriptor = Object.getOwnPropertyDescriptor(
      document,
      "hidden",
    );

    Object.defineProperty(document, "hidden", {
      configurable: true,
      get: () => isDocumentHidden,
    });
  });

  afterEach(() => {
    // Reset visibility before cleanup (while component still mounted)
    dispatchVisibilityChange(false);

    act(() => {
      vi.runOnlyPendingTimers();
    });
    vi.clearAllTimers();
    vi.useRealTimers();

    // Restore the original property descriptor to prevent test pollution
    if (originalHiddenDescriptor) {
      Object.defineProperty(document, "hidden", originalHiddenDescriptor);
    } else {
      // If no descriptor existed, remove the property
      delete (document as { hidden?: boolean }).hidden;
    }
  });

  it("shows 'Twój obraz' by default and switches to original image on 'Oryginał' tab", () => {
    render(
      <MemoryRouter>
        <UploadPage />
      </MemoryRouter>,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /mock successful upload/i }),
    );

    const yourImageTab = screen.getByRole("tab", {
      name: tr("upload.previewYourImage"),
    });
    const originalTab = screen.getByRole("tab", {
      name: tr("upload.previewOriginalTab"),
    });

    expect(yourImageTab).toHaveAttribute("aria-selected", "true");
    expect(originalTab).toHaveAttribute("aria-selected", "false");

    const previewImage = screen.getByRole("img", {
      name: /uploaded photo/i,
    });

    expect(previewImage).toHaveAttribute("src");
    expect(previewImage.getAttribute("src")).toContain("/upload/e_enhance/");

    fireEvent.click(originalTab);

    expect(yourImageTab).toHaveAttribute("aria-selected", "false");
    expect(originalTab).toHaveAttribute("aria-selected", "true");

    const originalPreviewImage = screen.getByRole("img", {
      name: /uploaded photo/i,
    });
    expect(originalPreviewImage).toHaveAttribute(
      "src",
      mockUploadResult.info.secure_url,
    );
  });

  it("stops preview loading after timeout and shows fallback error", () => {
    render(
      <MemoryRouter>
        <UploadPage />
      </MemoryRouter>,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /mock successful upload/i }),
    );

    expect(screen.getByRole("progressbar")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(30000);
    });

    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    expect(screen.getByText(tr("upload.aiPreviewError"))).toBeInTheDocument();
  });

  it("does not advance preview progress while page is hidden", () => {
    render(
      <MemoryRouter>
        <UploadPage />
      </MemoryRouter>,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /mock successful upload/i }),
    );

    act(() => {
      vi.advanceTimersByTime(400);
    });

    dispatchVisibilityChange(true);

    const progressbar = screen.getByRole("progressbar");
    const progressBeforeHidden = Number(
      progressbar.getAttribute("aria-valuenow") ?? "0",
    );

    act(() => {
      vi.advanceTimersByTime(2500);
    });

    const progressAfterHidden = Number(
      progressbar.getAttribute("aria-valuenow") ?? "0",
    );

    expect(progressAfterHidden).toBe(progressBeforeHidden);
  });

  it("forwards image debug toggle state to ImageUploader", () => {
    render(
      <MemoryRouter>
        <UploadPage imageDebugDataEnabled={false} />
      </MemoryRouter>,
    );

    expect(lastImageUploaderProps).toEqual({
      showDebugData: false,
    });
  });

  it("renders uploaded slot links after footer-triggered batch upload action", async () => {
    let uploadAction: (() => Promise<void>) | null = null;

    render(
      <MemoryRouter>
        <UploadPage
          onCheckoutWithUpload={(action) => {
            uploadAction = action;
          }}
        />
      </MemoryRouter>,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /mock selected slots/i }),
    );

    expect(uploadAction).not.toBeNull();

    await act(async () => {
      await uploadAction?.();
    });

    expect(
      screen.getByText(tr("upload.uploadedSlotsTitle")),
    ).toBeInTheDocument();
    expect(screen.getByText(tr("upload.slotLeft"))).toBeInTheDocument();
    expect(screen.getByText(tr("upload.slotCenter"))).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: tr("upload.openUploadedImage") }),
    ).toBeInTheDocument();
    expect(screen.getByText(tr("upload.slotUploadFailed"))).toBeInTheDocument();
  });
});
