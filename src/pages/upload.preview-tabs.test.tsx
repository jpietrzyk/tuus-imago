import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
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

vi.mock("@/components/custom-image-uploader", () => ({
  CustomImageUploader: ({
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

describe("UploadPage preview tabs", () => {
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
});
