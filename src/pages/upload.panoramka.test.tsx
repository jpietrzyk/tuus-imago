import React, { forwardRef, useImperativeHandle } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { UploadPage } from "./upload";

vi.mock("@/components/image-uploader", () => ({
  ImageUploader: forwardRef(
    (
      {
        onActiveImageSrcChange,
      }: {
        onActiveImageSrcChange?: (src: string | null) => void;
      },
      ref: React.ForwardedRef<unknown>,
    ) => {
      useImperativeHandle(ref, () => ({}));

      return (
        <div>
          <button
            type="button"
            onClick={() => onActiveImageSrcChange?.("blob:from-uploader")}
          >
            Mock uploader image loaded
          </button>
          <button
            type="button"
            onClick={() => onActiveImageSrcChange?.(null)}
          >
            Mock uploader image cleared
          </button>
        </div>
      );
    },
  ),
}));

describe("UploadPage panoramka integration", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("should hide panoramka when debug mode is off", () => {
    vi.stubEnv("VITE_SHOW_UPLOADER_DEBUG", "false");
    render(
      <MemoryRouter>
        <UploadPage />
      </MemoryRouter>,
    );

    expect(screen.queryByText("Panoramka")).not.toBeInTheDocument();
  });

  it("should keep panoramka folded by default in debug mode", () => {
    vi.stubEnv("VITE_SHOW_UPLOADER_DEBUG", "true");
    render(
      <MemoryRouter>
        <UploadPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("Panoramka")).toBeInTheDocument();
    expect(screen.queryByAltText("triptych")).not.toBeInTheDocument();
  });

  it("should show uploader image source in panoramka after expanding", () => {
    vi.stubEnv("VITE_SHOW_UPLOADER_DEBUG", "true");
    render(
      <MemoryRouter>
        <UploadPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByText("Mock uploader image loaded"));
    fireEvent.click(screen.getByText("Panoramka"));

    const triptychImage = screen.getByAltText("triptych");
    expect(triptychImage).toHaveAttribute("src", "blob:from-uploader");
  });

  it("should hide the panoramka own image loader when wired to the uploader", () => {
    vi.stubEnv("VITE_SHOW_UPLOADER_DEBUG", "true");
    render(
      <MemoryRouter>
        <UploadPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByText("Mock uploader image loaded"));
    fireEvent.click(screen.getByText("Panoramka"));

    expect(screen.getByAltText("triptych")).toBeInTheDocument();
    expect(screen.queryByText("Load image")).not.toBeInTheDocument();
  });

  it("should clear panoramka image when uploader clears its selection", () => {
    vi.stubEnv("VITE_SHOW_UPLOADER_DEBUG", "true");
    render(
      <MemoryRouter>
        <UploadPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByText("Mock uploader image loaded"));
    fireEvent.click(screen.getByText("Panoramka"));
    fireEvent.click(screen.getByText("Mock uploader image cleared"));

    expect(screen.queryByAltText("triptych")).not.toBeInTheDocument();
    expect(
      screen.getByText(
        "Load an image to display it here with mask and A/B/C parts",
      ),
    ).toBeInTheDocument();
  });
});
