import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ImageUploader } from "./image-uploader";

let mockImageWidth = 1200;
let mockImageHeight = 800;

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

        set src(_value: string) {
          queueMicrotask(() => {
            this.onload?.(new Event("load"));
          });
        }
      },
    );

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
        expect(screen.getByRole("img", { name: "Preview" })).toBeDefined();
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

      await screen.findByRole("img", { name: "Preview" });

      await waitFor(() => {
        const proportions = screen.getByTestId("image-proportions");
        expect(proportions.textContent).toContain("×");
        expect(proportions.textContent).toContain(":");
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

      const cancelButton = document
        .querySelector(".lucide-x")
        ?.closest("button");

      expect(cancelButton).toBeDefined();
      if (cancelButton) {
        fireEvent.click(cancelButton);
      }

      await waitFor(() => {
        expect(onImageMetadataChange).toHaveBeenLastCalledWith(null);
      });
    }
  });

  it("shows proportions dropdown with vertical, horizontal and rectangle options", async () => {
    render(<ImageUploader />);

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
          screen.getByRole("menuitem", { name: /^Vertical \(/ }),
        ).toBeInTheDocument();
        expect(
          screen.getByRole("menuitem", { name: /^Horizontal \(/ }),
        ).toBeInTheDocument();
        expect(
          screen.getByRole("menuitem", { name: /^Rectangle \(/ }),
        ).toBeInTheDocument();
      });
    }
  });

  it("changes displayed image proportion when dropdown option is selected", async () => {
    render(<ImageUploader />);

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
        expect(previewCanvas.height).toBe(675);
      });

      const dropdownTrigger = screen.getByTestId(
        "image-proportions-dropdown-trigger",
      );

      expect(dropdownTrigger.textContent).toMatch(/^Horizontal \(84\.38%\)/);
      expect(screen.getByTestId("selected-coverage-hint").textContent).toBe(
        "Showing 84.38% of original area",
      );

      fireEvent.pointerDown(dropdownTrigger);
      fireEvent.click(screen.getByRole("menuitem", { name: /^Vertical \(/ }));

      await waitFor(() => {
        expect(previewCanvas.width).toBe(600);
        expect(previewCanvas.height).toBe(800);
        expect(dropdownTrigger.textContent).toMatch(/^Vertical \(50\.00%\)/);
        expect(screen.getByTestId("selected-coverage-hint").textContent).toBe(
          "Showing 50.00% of original area",
        );
      });

      fireEvent.pointerDown(dropdownTrigger);
      fireEvent.click(screen.getByRole("menuitem", { name: /^Rectangle \(/ }));

      await waitFor(() => {
        expect(previewCanvas.width).toBe(800);
        expect(previewCanvas.height).toBe(800);
        expect(dropdownTrigger.textContent).toMatch(/^Rectangle \(66\.67%\)/);
        expect(screen.getByTestId("selected-coverage-hint").textContent).toBe(
          "Showing 66.67% of original area",
        );
      });
    }
  });

  it("shows side slider frames around preview after first image selection", async () => {
    render(<ImageUploader />);

    const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
    const input = document.querySelector(
      'input[type="file"][accept*="image/jpeg"]',
    );

    expect(input).toBeDefined();

    if (input) {
      fireEvent.change(input, { target: { files: [file] } });

      await screen.findByRole("img", { name: "Preview" });

      expect(screen.getByTestId("uploader-preview-slider")).toBeInTheDocument();
      expect(
        screen.queryByTestId("uploader-preview-strip"),
      ).not.toBeInTheDocument();
      expect(
        screen.getByTestId("uploader-slider-side-left"),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("uploader-slider-side-right"),
      ).toBeInTheDocument();
    }
  });

  it("adds second image when right side frame is clicked and file is selected", async () => {
    render(<ImageUploader />);

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

      fireEvent.click(screen.getByTestId("uploader-slider-side-right"));
      const editorInput = document.querySelector(
        'input[type="file"][accept="image/jpeg,image/png,image/webp"]',
      ) as HTMLInputElement | null;

      expect(editorInput).toBeDefined();

      if (editorInput) {
        fireEvent.change(editorInput, { target: { files: [secondFile] } });
      }

      await waitFor(() => {
        expect(screen.getByTestId("image-proportions").textContent).toContain(
          "900 × 900",
        );
      });

      await waitFor(() => {
        expect(
          screen.getByTestId("uploader-slider-side-left").querySelector("img"),
        ).toBeTruthy();
      });
    }
  });
});
