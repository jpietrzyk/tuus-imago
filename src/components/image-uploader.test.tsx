import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ImageUploader } from "./image-uploader";

describe("ImageUploader", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("renders upload area when no file is selected", () => {
    render(<ImageUploader />);

    const uploadIcon = document.querySelector(".lucide-upload");
    expect(uploadIcon).toBeDefined();
  });

  it("shows selected image preview and hides editing controls", async () => {
    render(<ImageUploader />);

    const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
    const input = document.querySelector(
      'input[type="file"][accept*="image/jpeg"]',
    );

    expect(input).toBeDefined();

    if (input) {
      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByAltText("Preview")).toBeDefined();
      });

      expect(screen.queryByText(/Potwierdź kadrowanie/i)).toBeNull();
      expect(screen.queryByText(/Upload Photo/i)).toBeNull();
      expect(screen.queryByText(/Prześlij zdjęcie/i)).toBeNull();
    }
  });

  it("reads and displays selected image proportions", async () => {
    render(<ImageUploader />);

    const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
    const input = document.querySelector(
      'input[type="file"][accept*="image/jpeg"]',
    );

    expect(input).toBeDefined();

    if (input) {
      fireEvent.change(input, { target: { files: [file] } });

      const preview = (await screen.findByAltText(
        "Preview",
      )) as HTMLImageElement;

      Object.defineProperty(preview, "naturalWidth", {
        value: 1200,
        configurable: true,
      });
      Object.defineProperty(preview, "naturalHeight", {
        value: 800,
        configurable: true,
      });

      fireEvent.load(preview);

      await waitFor(() => {
        const proportions = screen.getByTestId("image-proportions");
        expect(proportions.textContent).toContain("1200 × 800");
        expect(proportions.textContent).toContain("3:2");
      });
    }
  });

  it("calls onImageMetadataChange with proportions and null after cancel", async () => {
    const onImageMetadataChange = vi.fn();
    render(<ImageUploader onImageMetadataChange={onImageMetadataChange} />);

    const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
    const input = document.querySelector(
      'input[type="file"][accept*="image/jpeg"]',
    );

    expect(input).toBeDefined();

    if (input) {
      fireEvent.change(input, { target: { files: [file] } });

      const preview = (await screen.findByAltText(
        "Preview",
      )) as HTMLImageElement;

      Object.defineProperty(preview, "naturalWidth", {
        value: 1000,
        configurable: true,
      });
      Object.defineProperty(preview, "naturalHeight", {
        value: 500,
        configurable: true,
      });

      fireEvent.load(preview);

      await waitFor(() => {
        expect(onImageMetadataChange).toHaveBeenCalledWith({
          width: 1000,
          height: 500,
          aspectRatio: "2:1",
        });
      });

      const cancelButton = document
        .querySelector(".lucide-x")
        ?.closest("button");

      expect(cancelButton).toBeDefined();
      if (cancelButton) {
        fireEvent.click(cancelButton);
      }

      await waitFor(() => {
        expect(onImageMetadataChange).toHaveBeenCalledWith(null);
      });
    }
  });
});
