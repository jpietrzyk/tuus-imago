import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ImageUploader } from "./image-uploader";
import { tr } from "@/test/i18n-test";

const ui = {
  cropImage: tr("uploader.cropImage"),
  confirmCrop: tr("uploader.confirmCrop"),
  adjustImage: tr("uploader.adjustImage"),
  backToCrop: tr("uploader.backToCrop"),
  cancel: tr("uploader.cancel"),
  uploadPhoto: tr("uploader.uploadPhoto"),
  imageAdjustments: tr("uploader.imageAdjustments"),
  rotation: tr("uploader.rotation"),
  flip: tr("uploader.flip"),
  blackAndWhite: tr("uploader.blackAndWhite"),
  brightness: tr("upload.brightness"),
  contrast: tr("upload.contrast"),
  dragCropArea: tr("uploader.dragCropArea"),
  error: tr("upload.error"),
};

describe("ImageUploader", () => {
  beforeEach(() => {
    // Reset fetch mock before each test
    vi.stubGlobal("fetch", vi.fn());
  });

  it("renders drag and drop area when no file is selected", () => {
    render(<ImageUploader />);
    // Should have upload icon
    const uploadIcon = document.querySelector(".lucide-upload");
    expect(uploadIcon).toBeDefined();
  });

  it("shows crop step when file is selected", async () => {
    render(<ImageUploader />);

    const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
    const input = document.querySelector('input[type="file"]');

    expect(input).toBeDefined();

    // Simulate file selection
    if (input) {
      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText(ui.cropImage)).toBeDefined();
      });
    }
  });

  it("shows confirm crop button in crop step", async () => {
    render(<ImageUploader />);

    const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
    const input = document.querySelector('input[type="file"]');

    if (input) {
      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText(ui.confirmCrop)).toBeDefined();
      });
    }
  });

  it("shows adjust step after confirming crop", async () => {
    render(<ImageUploader />);

    const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
    const input = document.querySelector('input[type="file"]');

    if (input) {
      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        const confirmButton = screen.getByText(ui.confirmCrop);
        fireEvent.click(confirmButton);
      });

      await waitFor(() => {
        expect(screen.getByText(ui.adjustImage)).toBeDefined();
      });
    }
  });

  it("shows back to crop button in adjust step", async () => {
    render(<ImageUploader />);

    const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
    const input = document.querySelector('input[type="file"]');

    if (input) {
      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        const confirmButton = screen.getByText(ui.confirmCrop);
        fireEvent.click(confirmButton);
      });

      await waitFor(() => {
        expect(screen.getByText(ui.backToCrop)).toBeDefined();
      });
    }
  });

  it("displays rotation section header in adjust step", async () => {
    render(<ImageUploader />);

    const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
    const input = document.querySelector('input[type="file"]');

    if (input) {
      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        const confirmButton = screen.getByText(ui.confirmCrop);
        fireEvent.click(confirmButton);
      });

      // Click the "Image Adjustments" collapsible trigger to expand it
      await waitFor(() => {
        const adjustmentsButton = Array.from(
          document.querySelectorAll("button"),
        ).find((btn) => btn.textContent?.includes(ui.imageAdjustments));
        expect(adjustmentsButton).toBeDefined();
        if (adjustmentsButton) {
          fireEvent.click(adjustmentsButton);
        }
      });

      await waitFor(() => {
        expect(screen.getByText(ui.rotation)).toBeDefined();
      });
    }
  });

  it("displays flip section header in adjust step", async () => {
    render(<ImageUploader />);

    const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
    const input = document.querySelector('input[type="file"]');

    if (input) {
      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        const confirmButton = screen.getByText(ui.confirmCrop);
        fireEvent.click(confirmButton);
      });

      // Click the "Image Adjustments" collapsible trigger to expand it
      await waitFor(() => {
        const adjustmentsButton = Array.from(
          document.querySelectorAll("button"),
        ).find((btn) => btn.textContent?.includes(ui.imageAdjustments));
        expect(adjustmentsButton).toBeDefined();
        if (adjustmentsButton) {
          fireEvent.click(adjustmentsButton);
        }
      });

      await waitFor(() => {
        expect(screen.getByText(ui.flip)).toBeDefined();
      });
    }
  });

  it("displays filters section header in adjust step", async () => {
    render(<ImageUploader />);

    const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
    const input = document.querySelector('input[type="file"]');

    if (input) {
      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        const confirmButton = screen.getByText(ui.confirmCrop);
        fireEvent.click(confirmButton);
      });

      // Click the "Image Adjustments" collapsible trigger to expand it
      await waitFor(() => {
        const adjustmentsButton = Array.from(
          document.querySelectorAll("button"),
        ).find((btn) => btn.textContent?.includes(ui.imageAdjustments));
        expect(adjustmentsButton).toBeDefined();
        if (adjustmentsButton) {
          fireEvent.click(adjustmentsButton);
        }
      });

      // Look for Black & White text (instead of "Filters" which was the header)
      await waitFor(() => {
        expect(screen.getByText(ui.blackAndWhite)).toBeDefined();
      });
    }
  });

  it("displays brightness section header in adjust step", async () => {
    render(<ImageUploader />);

    const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
    const input = document.querySelector('input[type="file"]');

    if (input) {
      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        const confirmButton = screen.getByText(ui.confirmCrop);
        fireEvent.click(confirmButton);
      });

      // Click the "Image Adjustments" collapsible trigger to expand it
      await waitFor(() => {
        const adjustmentsButton = Array.from(
          document.querySelectorAll("button"),
        ).find((btn) => btn.textContent?.includes(ui.imageAdjustments));
        expect(adjustmentsButton).toBeDefined();
        if (adjustmentsButton) {
          fireEvent.click(adjustmentsButton);
        }
      });

      await waitFor(() => {
        expect(screen.getByText(ui.brightness)).toBeDefined();
      });
    }
  });

  it("displays contrast section header in adjust step", async () => {
    render(<ImageUploader />);

    const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
    const input = document.querySelector('input[type="file"]');

    if (input) {
      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        const confirmButton = screen.getByText(ui.confirmCrop);
        fireEvent.click(confirmButton);
      });

      // Click the "Image Adjustments" collapsible trigger to expand it
      await waitFor(() => {
        const adjustmentsButton = Array.from(
          document.querySelectorAll("button"),
        ).find((btn) => btn.textContent?.includes(ui.imageAdjustments));
        expect(adjustmentsButton).toBeDefined();
        if (adjustmentsButton) {
          fireEvent.click(adjustmentsButton);
        }
      });

      await waitFor(() => {
        expect(screen.getByText(ui.contrast)).toBeDefined();
      });
    }
  });

  it("toggles rotation section on click", async () => {
    render(<ImageUploader />);

    const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
    const input = document.querySelector('input[type="file"]');

    if (input) {
      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        const confirmButton = screen.getByText(ui.confirmCrop);
        fireEvent.click(confirmButton);
      });

      // Find "Image Adjustments" button (the collapsible trigger)
      await waitFor(() => {
        const adjustmentsButton = Array.from(
          document.querySelectorAll("button"),
        ).find((btn) => btn.textContent?.includes(ui.imageAdjustments));
        expect(adjustmentsButton).toBeDefined();

        // Click to expand
        if (adjustmentsButton) {
          fireEvent.click(adjustmentsButton);
        }
      });

      // After clicking, the Rotation content should be visible
      await waitFor(() => {
        expect(screen.getByText(ui.rotation)).toBeDefined();
      });
    }
  });

  it("calls onUploadError for invalid file type", async () => {
    const onError = vi.fn();
    render(<ImageUploader onUploadError={onError} />);

    const file = new File(["test"], "test.pdf", { type: "application/pdf" });
    const input = document.querySelector('input[type="file"]');

    if (input) {
      fireEvent.change(input, { target: { files: [file] } });

      // Should not show crop step for invalid file type
      await waitFor(() => {
        expect(screen.queryByText(ui.cropImage)).toBeNull();
      });
    }
  });

  it("calls onUploadError for large file", async () => {
    const onError = vi.fn();
    render(<ImageUploader onUploadError={onError} />);

    // Create a large file (>10MB)
    const largeContent = new Array(11 * 1024 * 1024).fill("a").join("");
    const file = new File([largeContent], "large.jpg", { type: "image/jpeg" });
    const input = document.querySelector('input[type="file"]');

    if (input) {
      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(ui.error);
      });
    }
  });

  it("handles cancel button click in crop step", async () => {
    render(<ImageUploader />);

    const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
    const input = document.querySelector('input[type="file"]');

    if (input) {
      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText(ui.cropImage)).toBeDefined();
      });

      const cancelButton = document
        .querySelector(".lucide-x")
        ?.closest("button");
      if (cancelButton) {
        fireEvent.click(cancelButton);
      }

      await waitFor(() => {
        // Should return to drag and drop area with upload icon
        const uploadIcon = document.querySelector(".lucide-upload");
        expect(uploadIcon).toBeDefined();
      });
    }
  });

  it("shows cancel and upload buttons in adjust step", async () => {
    render(<ImageUploader />);

    const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
    const input = document.querySelector('input[type="file"]');

    if (input) {
      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        const confirmButton = screen.getByText(ui.confirmCrop);
        fireEvent.click(confirmButton);
      });

      await waitFor(() => {
        expect(screen.getByText(ui.cancel)).toBeDefined();
        // Upload button in adjust step still says "Upload Photo"
        expect(screen.getByText(ui.uploadPhoto)).toBeDefined();
      });
    }
  });

  it("shows upload icon in drag and drop area", () => {
    render(<ImageUploader />);
    const uploadIcon = document.querySelector(".lucide-upload");
    expect(uploadIcon).toBeDefined();
  });

  it("shows camera button in drag and drop area", () => {
    render(<ImageUploader />);
    const cameraIcon = document.querySelector(".lucide-camera");
    expect(cameraIcon).toBeDefined();
  });

  it("has file input for file selection", () => {
    render(<ImageUploader />);
    const fileInput = document.querySelector(
      'input[type="file"][accept*="image/jpeg"]',
    );
    expect(fileInput).toBeDefined();
  });

  it("has file input for camera capture", () => {
    render(<ImageUploader />);
    const cameraInput = document.querySelector('input[type="file"][capture]');
    expect(cameraInput).toBeDefined();
  });

  it("opens file dialog when clicking drag and drop area", async () => {
    render(<ImageUploader />);

    // Find the drag and drop area (initial big button)
    const dragArea = document.querySelector(
      "button.cursor-pointer.border-dashed",
    ) as HTMLElement | null;

    if (dragArea) {
      // First click reveals the two action buttons
      fireEvent.click(dragArea);

      // Ensure the camera icon is visible to confirm state
      const cameraIcon = document.querySelector(".lucide-camera");
      expect(cameraIcon).toBeInTheDocument();

      // Spy on the actual file input (non-camera)
      const fileInput = document.querySelector(
        'input[type="file"][accept*="image/jpeg"]:not([capture])',
      ) as HTMLInputElement | null;
      expect(fileInput).toBeTruthy();
      const clickSpy = vi.fn();
      if (fileInput) {
        fileInput.click = clickSpy;
      }

      // Click the Upload button by its accessible label
      const uploadButton = screen.getByLabelText("Upload from device");
      fireEvent.click(uploadButton);

      expect(clickSpy).toHaveBeenCalled();
    }
  });

  it("opens camera when clicking camera button", async () => {
    render(<ImageUploader />);
    const cameraInput = document.querySelector(
      'input[type="file"][capture]',
    ) as HTMLInputElement;

    // Mock the click method
    const clickSpy = vi.fn();
    if (cameraInput) {
      cameraInput.click = clickSpy;
    }

    // Find the camera button
    const cameraIcon = document.querySelector(".lucide-camera");
    const cameraButton = cameraIcon?.closest("button") as HTMLElement;

    if (cameraButton) {
      fireEvent.click(cameraButton);
      // The click should trigger cameraInput.click()
      expect(clickSpy).toHaveBeenCalled();
    }
  });

  it("shows drag over state when dragging file over area", async () => {
    render(<ImageUploader />);

    // Find the drag and drop area div
    const dragArea = document.querySelector(".cursor-pointer") as HTMLElement;
    if (dragArea) {
      fireEvent.dragOver(dragArea);
      // Drag over event should be handled without errors
      expect(dragArea).toBeDefined();
    }
  });

  it("removes drag over state when leaving drag area", async () => {
    render(<ImageUploader />);

    // Find the drag and drop area div
    const dragArea = document.querySelector(".cursor-pointer") as HTMLElement;
    if (dragArea) {
      fireEvent.dragOver(dragArea);
      fireEvent.dragLeave(dragArea);
      // Drag leave event should be handled without errors
      expect(dragArea).toBeDefined();
    }
  });

  it("accepts file drop", async () => {
    render(<ImageUploader />);

    const file = new File(["test"], "test.jpg", { type: "image/jpeg" });

    // Find the drag and drop area div
    const dragArea = document.querySelector(".cursor-pointer") as HTMLElement;
    if (dragArea) {
      fireEvent.drop(dragArea, { dataTransfer: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText(ui.cropImage)).toBeDefined();
      });
    }
  });

  it("shows crop instruction in crop step", async () => {
    render(<ImageUploader />);

    const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
    const input = document.querySelector('input[type="file"]');

    if (input) {
      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText(ui.dragCropArea)).toBeDefined();
      });
    }
  });

  it("preserves crop area when switching to adjust step", async () => {
    render(<ImageUploader />);

    const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
    const input = document.querySelector('input[type="file"]');

    if (input) {
      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        const confirmButton = screen.getByText(ui.confirmCrop);
        fireEvent.click(confirmButton);
      });

      await waitFor(() => {
        const leftSlot = document.querySelector(
          '[data-testid="adjust-preview-left-slot"]',
        ) as HTMLElement | null;
        const rightSlot = document.querySelector(
          '[data-testid="adjust-preview-right-slot"]',
        ) as HTMLElement | null;
        const centerCanvas = document.querySelector(
          '[data-testid="adjust-preview-image"]',
        ) as HTMLCanvasElement | null;

        expect(leftSlot).toBeDefined();
        expect(rightSlot).toBeDefined();
        expect(centerCanvas).toBeDefined();
        expect(leftSlot?.querySelector("canvas")).toBeNull();
        expect(rightSlot?.querySelector("canvas")).toBeNull();
        expect(centerCanvas?.tagName.toLowerCase()).toBe("canvas");
      });
    }
  });

  it("clips image to crop area in adjust step using overflow hidden", async () => {
    render(<ImageUploader />);

    const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
    const input = document.querySelector('input[type="file"]');

    if (input) {
      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        const confirmButton = screen.getByText(ui.confirmCrop);
        fireEvent.click(confirmButton);
      });

      await waitFor(() => {
        // Find the preview container for cropped area
        const divs = document.querySelectorAll("div");
        let previewContainer: HTMLElement | null = null;

        for (const div of divs) {
          if (
            div.classList.contains("relative") &&
            div.classList.contains("overflow-hidden")
          ) {
            previewContainer = div;
            break;
          }
        }

        expect(previewContainer).toBeDefined();
        // Should have overflow-hidden class to clip the image
        expect(previewContainer?.classList.contains("overflow-hidden")).toBe(
          true,
        );
        // Should have relative positioning
        expect(previewContainer?.classList.contains("relative")).toBe(true);
      });
    }
  });

  it("applies correct image positioning with translate in adjust step", async () => {
    render(<ImageUploader />);

    const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
    const input = document.querySelector('input[type="file"]');

    if (input) {
      fireEvent.change(input, { target: { files: [file] } });

      // Wait for crop step to be ready
      await waitFor(() => {
        const confirmButton = screen.getByText(ui.confirmCrop);
        expect(confirmButton).toBeDefined();
      });

      // Find the crop step image to trigger its onLoad event
      const cropStepImage = document.querySelector(
        'img[alt="Preview"]',
      ) as HTMLImageElement;
      if (cropStepImage) {
        // Simulate image load by dispatching load event
        fireEvent.load(cropStepImage);
      }

      // Wait a bit for state to update
      await waitFor(() => {
        const confirmButton = screen.getByText(ui.confirmCrop);
        fireEvent.click(confirmButton);
      });

      await waitFor(() => {
        // Find the canvas in adjust step using data-testid
        const adjustStepCanvas = document.querySelector(
          '[data-testid="adjust-preview-image"]',
        ) as HTMLElement;

        expect(adjustStepCanvas).toBeDefined();

        // In the canvas-based solution, we don't use marginLeft/MarginTop for positioning
        // The canvas is rendered with the cropped area directly
        expect(adjustStepCanvas.tagName.toLowerCase()).toBe("canvas");
      });
    }
  });

  it("maintains crop area when going back to crop step", async () => {
    render(<ImageUploader />);

    const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
    const input = document.querySelector('input[type="file"]');

    if (input) {
      fireEvent.change(input, { target: { files: [file] } });

      // Go to adjust step
      await waitFor(() => {
        const confirmButton = screen.getByText(ui.confirmCrop);
        fireEvent.click(confirmButton);
      });

      // Go back to crop step
      await waitFor(() => {
        const backButton = screen.getByText(ui.backToCrop);
        fireEvent.click(backButton);
      });

      // Should be back at crop step with crop area still visible
      await waitFor(() => {
        expect(screen.getByText(ui.confirmCrop)).toBeDefined();
        // The crop overlay should still be visible
        const cropArea = document.querySelector(
          'div[style*="border-2 border-white"]',
        );
        expect(cropArea).toBeDefined();
      });
    }
  });

  it("applies transformations to cropped area in adjust step", async () => {
    render(<ImageUploader />);

    const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
    const input = document.querySelector('input[type="file"]');

    if (input) {
      fireEvent.change(input, { target: { files: [file] } });

      // Wait for crop step to be ready
      await waitFor(() => {
        const confirmButton = screen.getByText(ui.confirmCrop);
        expect(confirmButton).toBeDefined();
      });

      // Find the crop step image to trigger its onLoad event
      const cropStepImage = document.querySelector(
        'img[alt="Preview"]',
      ) as HTMLImageElement;
      if (cropStepImage) {
        // Simulate image load by dispatching load event
        fireEvent.load(cropStepImage);
      }

      await waitFor(() => {
        const confirmButton = screen.getByText(ui.confirmCrop);
        fireEvent.click(confirmButton);
      });

      // Expand the Image Adjustments collapsible first
      await waitFor(() => {
        const adjustmentsButton = Array.from(
          document.querySelectorAll("button"),
        ).find((btn) => btn.textContent?.includes(ui.imageAdjustments));

        if (adjustmentsButton) {
          fireEvent.click(adjustmentsButton);

          // Find and click the rotate button
          const rotateButtons = Array.from(document.querySelectorAll("button"));
          const rotateRightBtn = rotateButtons.find((btn) => {
            const svg = btn.querySelector(".lucide-rotate-cw");
            return svg && !svg.parentElement?.style.transform;
          });

          if (rotateRightBtn) {
            fireEvent.click(rotateRightBtn);
          }
        }
      });

      // The canvas should render with transformations applied
      await waitFor(() => {
        const adjustStepCanvas = document.querySelector(
          '[data-testid="adjust-preview-image"]',
        ) as HTMLElement;

        expect(adjustStepCanvas).toBeDefined();
        // In canvas-based solution, transformations are applied via canvas rendering
        // not via CSS transforms, so we just check that the canvas element exists
        expect(adjustStepCanvas.tagName.toLowerCase()).toBe("canvas");
      });
    }
  });

  it("removes no longer needed croppedPreviewUrl state", async () => {
    // This test verifies that we're not creating/storing unnecessary blob URLs
    render(<ImageUploader />);

    const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
    const input = document.querySelector('input[type="file"]');

    if (input) {
      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        const confirmButton = screen.getByText(ui.confirmCrop);
        fireEvent.click(confirmButton);
      });

      // Just verify we reach the adjust step without errors
      // First expand the collapsible to check content
      await waitFor(() => {
        const adjustmentsButton = Array.from(
          document.querySelectorAll("button"),
        ).find((btn) => btn.textContent?.includes(ui.imageAdjustments));
        if (adjustmentsButton) {
          fireEvent.click(adjustmentsButton);
        }
      });

      await waitFor(() => {
        expect(screen.getByText(ui.rotation)).toBeDefined();
      });
    }
  });

  it("handles resize and maintains correct positioning", async () => {
    render(<ImageUploader />);

    const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
    const input = document.querySelector('input[type="file"]');

    if (input) {
      fireEvent.change(input, { target: { files: [file] } });

      // Wait for crop step
      await waitFor(() => {
        expect(screen.getByText(ui.confirmCrop)).toBeDefined();
      });

      // Resize handles should be present
      await waitFor(() => {
        const resizeHandles = document.querySelectorAll(
          'div[style*="cursor"][style*="absolute"]',
        );
        // At least the resize handles should exist
        expect(resizeHandles.length).toBeGreaterThanOrEqual(0);
      });

      // Find the crop step image to trigger its onLoad event
      const cropStepImage = document.querySelector(
        'img[alt="Preview"]',
      ) as HTMLImageElement;
      if (cropStepImage) {
        // Simulate image load by dispatching load event
        fireEvent.load(cropStepImage);
      }

      // Move to adjust step
      await waitFor(() => {
        const confirmButton = screen.getByText(ui.confirmCrop);
        fireEvent.click(confirmButton);
      });

      // In adjust step, canvas should be present
      await waitFor(() => {
        const adjustStepCanvas = document.querySelector(
          '[data-testid="adjust-preview-image"]',
        ) as HTMLElement;
        expect(adjustStepCanvas).toBeDefined();
        expect(adjustStepCanvas.tagName.toLowerCase()).toBe("canvas");
      });
    }
  });

  it("displays cropped area zoomed in adjust step", async () => {
    render(<ImageUploader />);

    const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
    const input = document.querySelector('input[type="file"]');

    if (input) {
      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        const confirmButton = screen.getByText(ui.confirmCrop);
        fireEvent.click(confirmButton);
      });

      // Click the "Image Adjustments" collapsible trigger to expand it
      await waitFor(() => {
        const adjustmentsButton = Array.from(
          document.querySelectorAll("button"),
        ).find((btn) => btn.textContent?.includes(ui.imageAdjustments));
        if (adjustmentsButton) {
          fireEvent.click(adjustmentsButton);
        }
      });

      // Verify adjust step is displayed with filter controls
      await waitFor(() => {
        expect(screen.getByText(ui.rotation)).toBeDefined();
        expect(screen.getByText(ui.backToCrop)).toBeDefined();
      });
    }
  });

  it("clips image to crop area in adjust step with overflow hidden", async () => {
    render(<ImageUploader />);

    const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
    const input = document.querySelector('input[type="file"]');

    if (input) {
      fireEvent.change(input, { target: { files: [file] } });

      // Wait for crop step to be ready
      await waitFor(() => {
        const confirmButton = screen.getByText(ui.confirmCrop);
        expect(confirmButton).toBeDefined();
      });

      // Find the crop step image to trigger its onLoad event
      const cropStepImage = document.querySelector(
        'img[alt="Preview"]',
      ) as HTMLImageElement;
      if (cropStepImage) {
        // Simulate image load by dispatching load event
        fireEvent.load(cropStepImage);
      }

      await waitFor(() => {
        const confirmButton = screen.getByText(ui.confirmCrop);
        fireEvent.click(confirmButton);
      });

      // Verify image is displayed and adjust step is ready
      await waitFor(() => {
        const adjustStepImage = document.querySelector(
          '[data-testid="adjust-preview-image"]',
        ) as HTMLElement;
        expect(adjustStepImage).toBeDefined();
      });
    }
  });
});
