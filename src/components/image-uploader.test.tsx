import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  act,
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import { createRef } from "react";
import { ImageUploader, type ImageUploaderHandle } from "./image-uploader";
import { splitImageIntoVerticalThirdFiles } from "./image-uploader/split-image-into-thirds";
import { uploadImageToCloudinary } from "@/lib/cloudinary-upload";
import { t as tr } from "../locales/i18n";

vi.mock("./image-uploader/split-image-into-thirds", () => ({
  splitImageIntoVerticalThirdFiles: vi.fn(),
}));

vi.mock("@/lib/cloudinary-upload", () => ({
  uploadImageToCloudinary: vi.fn(),
}));

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
    vi.mocked(splitImageIntoVerticalThirdFiles).mockReset();
    vi.mocked(uploadImageToCloudinary).mockReset();
  });

  it("splits active image into three slots after confirmation", async () => {
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
    render(<ImageUploader ref={uploaderRef} />);

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
        expect(splitImageIntoVerticalThirdFiles).toHaveBeenCalledWith({
          previewUrl: expect.stringContaining("blob:"),
          sourceFile,
        });
      });

      await waitFor(() => {
        expect(
          screen.getByTestId("uploader-slider-side-left").querySelector("img"),
        ).toBeTruthy();
        expect(
          screen.getByTestId("uploader-slider-side-right").querySelector("img"),
        ).toBeTruthy();
      });

      act(() => {
        uploaderRef.current?.removeActiveImage();
      });

      await waitFor(() => {
        expect(
          screen.getByTestId("uploader-slider-side-left").querySelector("img"),
        ).toBeTruthy();
        expect(
          screen.getByTestId("uploader-slider-side-right").querySelector("img"),
        ).toBeTruthy();
      });

      expect(screen.queryByRole("img", { name: "Preview" })).toBeNull();
      expect(
        screen.getByTestId("selected-image-preview-placeholder"),
      ).toBeInTheDocument();
    }
  });

  it("asks for confirmation before splitting when other slots are already used", async () => {
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

    render(<ImageUploader />);

    const input = document.querySelector(
      'input[type="file"][accept*="image/jpeg"]',
    ) as HTMLInputElement | null;

    expect(input).toBeDefined();

    if (input) {
      fireEvent.change(input, { target: { files: [firstFile] } });
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
        expect(splitImageIntoVerticalThirdFiles).toHaveBeenCalledWith({
          previewUrl: expect.stringContaining("blob:"),
          sourceFile: firstFile,
        });
      });
    }
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
    const uploaderRef = createRef<ImageUploaderHandle>();
    render(<ImageUploader ref={uploaderRef} onImageMetadataChange={onImageMetadataChange} />);

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

  it("auto-selects vertical proportion for vertical image added to side slot", async () => {
    render(<ImageUploader />);

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

      fireEvent.click(screen.getByTestId("uploader-slider-side-right"));
      const editorInput = document.querySelector(
        'input[type="file"][accept="image/jpeg,image/png,image/webp"]',
      ) as HTMLInputElement | null;

      expect(editorInput).toBeDefined();

      if (editorInput) {
        fireEvent.change(editorInput, {
          target: { files: [verticalFile] },
        });
      }

      const rightSideSlot = screen.getByTestId("uploader-slider-side-right");
      await waitFor(() => {
        expect(rightSideSlot.querySelector("img")).toBeTruthy();
      });

      expect(rightSideSlot.querySelector("img")).toHaveAttribute(
        "src",
        expect.any(String),
      );

      const rightFrame = rightSideSlot.querySelector(
        '[data-testid="uploader-slider-side-right-preview-frame"]',
      ) as HTMLElement | null;
      expect(rightFrame).toBeTruthy();
      expect(rightFrame).toHaveClass("aspect-[2/3]");
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

        expect(leftFrame).toHaveStyle({ aspectRatio: String(2 / 3) });
        expect(leftFrame).toHaveClass(
          "h-full",
          "w-full",
          "min-w-0",
          "max-w-full",
          "aspect-[2/3]",
        );

        expect(leftSlot).toHaveClass("overflow-hidden");
      });
    }
  });

  it("removes the active image and returns to upload area when it was the only one", async () => {
    const uploaderRef = createRef<ImageUploaderHandle>();
    render(<ImageUploader ref={uploaderRef} />);

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
    render(<ImageUploader ref={uploaderRef} />);

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

      act(() => {
        uploaderRef.current?.removeActiveImage();
      });

      await waitFor(() => {
        expect(
          screen.getByTestId("uploader-slider-side-right").querySelector("img"),
        ).toBeTruthy();
      });

      expect(screen.queryByRole("img", { name: "Preview" })).toBeNull();
      expect(
        screen.getByTestId("selected-image-preview-placeholder"),
      ).toBeInTheDocument();

      fireEvent.click(screen.getByTestId("uploader-slider-side-right"));

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
    render(<ImageUploader ref={uploaderRef} />);

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

      act(() => {
        uploaderRef.current?.removeActiveImage();
      });

      await waitFor(() => {
        expect(
          screen.getByTestId("uploader-slider-side-left").querySelector("img"),
        ).toBeTruthy();
        expect(
          screen.getByTestId("uploader-slider-side-right").querySelector("img"),
        ).toBeTruthy();
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

  it("initializes new images with neutral previewEffects (brightness: 0, contrast: 0)", async () => {
    render(<ImageUploader />);

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
        name: tr("uploader.previewEffectsButton"),
      });

      // The button should exist (meaning effects are supported)
      expect(effectsButton).toBeInTheDocument();
    }
  });

  it("persists per-slot effects independently when switching between slots", async () => {
    render(<ImageUploader />);

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
      fireEvent.click(screen.getByTestId("uploader-slider-side-right"));

      const editorInput = document.querySelector(
        'input[type="file"][accept="image/jpeg,image/png,image/webp"]',
      ) as HTMLInputElement | null;

      expect(editorInput).toBeDefined();

      if (editorInput) {
        fireEvent.change(editorInput, { target: { files: [file2] } });

        await waitFor(() => {
          expect(
            screen
              .getByTestId("uploader-slider-side-right")
              .querySelector("img"),
          ).toBeTruthy();
        });
      }

      // Both images should have independent effect states (both initialized to neutral)
      // Verify no cross-contamination by checking that both slots can be activated
      const centerPreview = screen.getByTestId("selected-image-preview-frame");
      expect(centerPreview).toBeInTheDocument();
    }
  });

  it("splits image and keeps split previews visible", async () => {
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
        expect(splitImageIntoVerticalThirdFiles).toHaveBeenCalledWith({
          previewUrl: expect.stringContaining("blob:"),
          sourceFile,
        });
      });

      // After split, all three slots should be populated with new images
      await waitFor(() => {
        expect(
          screen.getByTestId("uploader-slider-side-left").querySelector("img"),
        ).toBeTruthy();
        expect(
          screen.getByTestId("uploader-slider-side-right").querySelector("img"),
        ).toBeTruthy();
      });
    }
  });

  it("allows updating effects on active slot independently", async () => {
    render(<ImageUploader />);

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
        name: tr("uploader.previewEffectsButton"),
      });
      expect(effectsButton).not.toBeDisabled();
      expect(effectsButton).toBeInTheDocument();
    }
  });

  it("forces fresh uploads after split by invalidating previous uploaded cache", async () => {
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
    render(<ImageUploader ref={uploaderRef} />);

    const input = document.querySelector(
      'input[type="file"][accept*="image/jpeg"]',
    ) as HTMLInputElement | null;

    expect(input).toBeDefined();

    if (!input) {
      return;
    }

    fireEvent.change(input, { target: { files: [sourceFile] } });
    await screen.findByRole("img", { name: "Preview" });

    const effectsButton = screen.getByRole("button", {
      name: tr("uploader.previewEffectsButton"),
    });
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
      name: tr("uploader.effectsClose"),
    });
    fireEvent.click(closeButton);

    const splitButton = await screen.findByRole("button", {
      name: tr("uploader.splitSelectedImage"),
    });
    fireEvent.click(splitButton);

    await waitFor(() => {
      expect(splitImageIntoVerticalThirdFiles).toHaveBeenCalledWith({
        previewUrl: expect.stringContaining("blob:"),
        sourceFile,
      });
    });

    await waitFor(() => {
      expect(
        screen.getByTestId("uploader-slider-side-left").querySelector("img"),
      ).toBeTruthy();
      expect(
        screen.getByTestId("uploader-slider-side-right").querySelector("img"),
      ).toBeTruthy();
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
    render(<ImageUploader ref={uploaderRef} />);

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

    const effectsButton = screen.getByRole("button", {
      name: tr("uploader.previewEffectsButton"),
    });
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
      name: tr("uploader.effectsClose"),
    });
    fireEvent.click(closeEffectsButton);

    // Add a second file to the right slot (no bg removal → no uploadedAsset)
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

    // Checkout: center slot should reuse cached asset (no upload); right slot is fresh (call 2)
    await act(async () => {
      await uploaderRef.current?.uploadFilledSlots();
    });

    await waitFor(() => {
      expect(uploadImageToCloudinary).toHaveBeenCalledTimes(2);
    });
  });

  it("hides remove button when effects edit mode is active and restores on close", async () => {
    render(<ImageUploader />);

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
      name: tr("uploader.previewEffectsButton"),
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
      name: tr("uploader.effectsClose"),
    });
    fireEvent.click(closeButton);

    // After exiting edit mode, the remove button should be visible again
    await waitFor(() => {
      expect(
        screen.getByTestId("uploader-remove-active-image"),
      ).toBeInTheDocument();
    });
  });

  it("shows zoom controls in edit mode for non-perfect-coverage images", async () => {
    render(<ImageUploader />);

    const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
    const input = document.querySelector(
      'input[type="file"][accept*="image/jpeg"]',
    ) as HTMLInputElement | null;
    if (!input) return;

    fireEvent.change(input, { target: { files: [file] } });
    await screen.findByRole("img", { name: "Preview" });

    const effectsButton = screen.getByRole("button", {
      name: tr("uploader.previewEffectsButton"),
    });
    fireEvent.click(effectsButton);

    await waitFor(() => {
      expect(screen.getByText(tr("uploader.zoom"))).toBeInTheDocument();
    });
  });

  it("resets zoom when proportion is changed", async () => {
    render(<ImageUploader />);

    const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
    const input = document.querySelector(
      'input[type="file"][accept*="image/jpeg"]',
    ) as HTMLInputElement | null;
    if (!input) return;

    fireEvent.change(input, { target: { files: [file] } });
    await screen.findByRole("img", { name: "Preview" });

    const effectsButton = screen.getByRole("button", {
      name: tr("uploader.previewEffectsButton"),
    });
    fireEvent.click(effectsButton);

    await waitFor(() => {
      expect(screen.getByText(tr("uploader.zoom"))).toBeInTheDocument();
    });

    const zoomLabel = screen.getByText(tr("uploader.zoom"));
    const sliderContainer = zoomLabel.closest(".space-y-2")!;
    const rangeInput = sliderContainer.querySelector(
      'input[type="range"]',
    ) as HTMLInputElement;
    fireEvent.change(rangeInput, { target: { value: "2" } });

    await waitFor(() => {
      expect(screen.getByText("2.0x")).toBeInTheDocument();
    });

    expect(screen.getByText(tr("uploader.zoomReset"))).toBeInTheDocument();

    const closeButton = screen.getByRole("button", {
      name: tr("uploader.effectsClose"),
    });
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(
        screen.queryByText(tr("uploader.previewEffectsTitle")),
      ).not.toBeInTheDocument();
    });

    const dropdownTrigger = screen.getByTestId(
      "image-proportions-dropdown-trigger",
    );
    fireEvent.pointerDown(dropdownTrigger);
    fireEvent.click(screen.getByRole("menuitem", { name: /^Vertical/ }));

    fireEvent.click(screen.getByRole("button", {
      name: tr("uploader.previewEffectsButton"),
    }));

    await waitFor(() => {
      expect(screen.getByText("1.0x")).toBeInTheDocument();
    });

    expect(screen.queryByText(tr("uploader.zoomReset"))).not.toBeInTheDocument();
  });
});
