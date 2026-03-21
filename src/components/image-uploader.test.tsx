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

      fireEvent.pointerDown(dropdownTrigger);
      fireEvent.click(screen.getByRole("menuitem", { name: /^Vertical/ }));

      await waitFor(() => {
        expect(previewCanvas.width).toBe(533);
        expect(previewCanvas.height).toBe(800);
        expect(dropdownTrigger).toHaveAttribute("aria-label", "Vertical");
      });

      fireEvent.pointerDown(dropdownTrigger);
      fireEvent.click(screen.getByRole("menuitem", { name: /^Rectangle/ }));

      await waitFor(() => {
        expect(previewCanvas.width).toBe(800);
        expect(previewCanvas.height).toBe(800);
        expect(dropdownTrigger).toHaveAttribute("aria-label", "Rectangle");
      });
    }
  });

  it("defaults to the optimal proportion based on image coverage", async () => {
    render(<ImageUploader />);

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

      expect(dropdownTrigger).toHaveAttribute("aria-label", "Vertical");
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
      expect(
        screen.getByTestId("uploader-slider-side-left").querySelector("img"),
      ).toBeNull();
      expect(
        screen.getByTestId("uploader-slider-side-right").querySelector("img"),
      ).toBeNull();
    }
  });

  it("adds second image to the clicked right slot", async () => {
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

      const previewCanvas = screen.getByTestId(
        "selected-image-preview-canvas",
      ) as HTMLCanvasElement;
      await waitFor(() => {
        expect(previewCanvas.width).toBe(1200);
        expect(previewCanvas.height).toBe(675);
      });

      await waitFor(() => {
        expect(
          screen.getByTestId("uploader-slider-side-right").querySelector("img"),
        ).toBeTruthy();
      });

      expect(
        screen.getByTestId("uploader-slider-side-left").querySelector("img"),
      ).toBeNull();
    }
  });

  it("adds second image to the clicked left slot", async () => {
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

      fireEvent.click(screen.getByTestId("uploader-slider-side-left"));
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
        expect(previewCanvas.height).toBe(675);
      });

      await waitFor(() => {
        expect(
          screen.getByTestId("uploader-slider-side-left").querySelector("img"),
        ).toBeTruthy();
      });

      expect(
        screen.getByTestId("uploader-slider-side-right").querySelector("img"),
      ).toBeNull();
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

    render(<ImageUploader />);

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

      fireEvent.click(screen.getByTestId("uploader-slider-side-right"));

      const editorInput = document.querySelector(
        'input[type="file"][accept="image/jpeg,image/png,image/webp"]',
      ) as HTMLInputElement | null;

      expect(editorInput).toBeDefined();

      if (editorInput) {
        fireEvent.change(editorInput, { target: { files: [secondFile] } });
      }

      await waitFor(() => {
        expect(
          screen.getByTestId("uploader-slider-side-right").querySelector("img"),
        ).toBeTruthy();
      });

      fireEvent.click(screen.getByTestId("uploader-slider-side-right"));

      await waitFor(() => {
        const leftPreview = screen
          .getByTestId("uploader-slider-side-left")
          .querySelector("img");

        expect(leftPreview).toHaveAttribute("src", "blob:first-preview");
      });

      expect(createObjectURLSpy).toHaveBeenCalledTimes(2);
      expect(revokeObjectURLSpy).not.toHaveBeenCalledWith("blob:first-preview");
    }
  });

  it("shows non-active selected preview at main size clipped by side slot", async () => {
    render(<ImageUploader />);

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

      fireEvent.click(screen.getByTestId("uploader-slider-side-right"));

      const editorInput = document.querySelector(
        'input[type="file"][accept="image/jpeg,image/png,image/webp"]',
      ) as HTMLInputElement | null;

      expect(editorInput).toBeDefined();

      if (editorInput) {
        fireEvent.change(editorInput, { target: { files: [secondFile] } });
      }

      fireEvent.click(screen.getByTestId("uploader-slider-side-right"));

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

      await waitFor(() => {
        const leftFrame = screen.getByTestId(
          "uploader-slider-side-left-preview-frame",
        );
        const leftSlot = screen.getByTestId("uploader-slider-side-left");

        expect(leftFrame).toHaveStyle({ aspectRatio: String(1) });
        expect(leftFrame).toHaveClass(
          "h-full",
          "w-full",
          "min-w-0",
          "max-w-full",
          "aspect-square",
        );

        expect(leftSlot).toHaveClass("overflow-hidden");
      });
    }
  });

  it("removes the active image and returns to upload area when it was the only one", async () => {
    render(<ImageUploader />);

    const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
    const input = document.querySelector(
      'input[type="file"][accept*="image/jpeg"]',
    ) as HTMLInputElement | null;

    expect(input).toBeDefined();

    if (input) {
      fireEvent.change(input, { target: { files: [file] } });

      await screen.findByRole("img", { name: "Preview" });

      fireEvent.click(screen.getByTestId("uploader-remove-active-image"));

      await waitFor(() => {
        expect(screen.queryByRole("img", { name: "Preview" })).toBeNull();
      });
    }
  });

  it("removes current active image and keeps remaining image active", async () => {
    render(<ImageUploader />);

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

      fireEvent.click(screen.getByTestId("uploader-slider-side-right"));

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
        expect(previewCanvas.height).toBe(675);
      });

      fireEvent.click(screen.getByTestId("uploader-remove-active-image"));

      await waitFor(() => {
        expect(previewCanvas.width).toBe(900);
        expect(previewCanvas.height).toBe(506);
      });

      await waitFor(() => {
        expect(
          screen.getByTestId("uploader-slider-side-right").querySelector("img"),
        ).toBeNull();
      });
    }
  });

  it("keeps side slots populated and falls back to remaining images after removals", async () => {
    render(<ImageUploader />);

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
        expect(previewCanvas.height).toBe(675);
      });

      mockImageWidth = 900;
      mockImageHeight = 900;
      fireEvent.click(screen.getByTestId("uploader-slider-side-right"));

      let editorInput = document.querySelector(
        'input[type="file"][accept="image/jpeg,image/png,image/webp"]',
      ) as HTMLInputElement | null;
      expect(editorInput).toBeDefined();
      if (editorInput) {
        fireEvent.change(editorInput, { target: { files: [secondFile] } });
      }

      mockImageWidth = 700;
      mockImageHeight = 1100;
      fireEvent.click(screen.getByTestId("uploader-slider-side-left"));

      editorInput = document.querySelector(
        'input[type="file"][accept="image/jpeg,image/png,image/webp"]',
      ) as HTMLInputElement | null;
      expect(editorInput).toBeDefined();
      if (editorInput) {
        fireEvent.change(editorInput, { target: { files: [thirdFile] } });
      }

      await waitFor(() => {
        expect(
          screen.getByTestId("uploader-slider-side-left").querySelector("img"),
        ).toBeTruthy();
        expect(
          screen.getByTestId("uploader-slider-side-right").querySelector("img"),
        ).toBeTruthy();
      });

      fireEvent.click(screen.getByTestId("uploader-remove-active-image"));

      await waitFor(() => {
        expect(
          screen.getByRole("img", { name: "Preview" }),
        ).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId("uploader-remove-active-image"));

      await waitFor(() => {
        expect(
          screen.getByRole("img", { name: "Preview" }),
        ).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId("uploader-remove-active-image"));

      await waitFor(() => {
        expect(screen.queryByRole("img", { name: "Preview" })).toBeNull();
      });
    }
  });

  it("applies swipe threshold before changing active slot", async () => {
    render(<ImageUploader />);

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
        expect(previewCanvas.height).toBe(675);
      });

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

      // Wait for second image to register in right slot
      await waitFor(() => {
        expect(
          screen.getByTestId("uploader-slider-side-right").querySelector("img"),
        ).toBeTruthy();
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
});
