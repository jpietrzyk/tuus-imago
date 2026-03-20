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

vi.mock("@/components/image-uploader", () => ({
  ImageUploader: ({
    onUploadSuccess,
  }: {
    onUploadSuccess?: (
      result: UploadResult,
      transformations: ImageTransformations,
    ) => void;
  }) => (
    <button
      type="button"
      onClick={() => onUploadSuccess?.(mockUploadResult, mockTransformations)}
    >
      Mock successful upload
    </button>
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
  beforeEach(() => {
    vi.useFakeTimers();
    isDocumentHidden = false;

    Object.defineProperty(document, "hidden", {
      configurable: true,
      get: () => isDocumentHidden,
    });
  });

  afterEach(() => {
    act(() => {
      vi.runOnlyPendingTimers();
    });
    vi.useRealTimers();
    vi.clearAllTimers();
    dispatchVisibilityChange(false);
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
});
