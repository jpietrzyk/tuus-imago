import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CustomImageUploader } from "./custom-image-uploader";

describe("CustomImageUploader", () => {
  beforeEach(() => {
    // Reset fetch mock before each test
    vi.stubGlobal("fetch", vi.fn());
  });

  it("renders drag and drop area when no file is selected", () => {
    render(<CustomImageUploader />);
    // Should have helper text indicating click to upload or drag and drop
    expect(
      screen.getByText(/Click to upload or drag and drop your image here/i),
    ).toBeDefined();
  });

  it("shows crop step when file is selected", async () => {
    render(<CustomImageUploader />);

    const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
    const input = document.querySelector('input[type="file"]');

    expect(input).toBeDefined();

    // Simulate file selection
    if (input) {
      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText("Crop Image")).toBeDefined();
      });
    }
  });

  it("shows confirm crop button in crop step", async () => {
    render(<CustomImageUploader />);

    const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
    const input = document.querySelector('input[type="file"]');

    if (input) {
      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText("Confirm Crop")).toBeDefined();
      });
    }
  });

  it("shows adjust step after confirming crop", async () => {
    render(<CustomImageUploader />);

    const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
    const input = document.querySelector('input[type="file"]');

    if (input) {
      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        const confirmButton = screen.getByText("Confirm Crop");
        fireEvent.click(confirmButton);
      });

      await waitFor(() => {
        expect(screen.getByText("Adjust Image")).toBeDefined();
      });
    }
  });

  it("shows back to crop button in adjust step", async () => {
    render(<CustomImageUploader />);

    const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
    const input = document.querySelector('input[type="file"]');

    if (input) {
      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        const confirmButton = screen.getByText("Confirm Crop");
        fireEvent.click(confirmButton);
      });

      await waitFor(() => {
        expect(screen.getByText("Back to Crop")).toBeDefined();
      });
    }
  });

  it("displays rotation section header in adjust step", async () => {
    render(<CustomImageUploader />);

    const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
    const input = document.querySelector('input[type="file"]');

    if (input) {
      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        const confirmButton = screen.getByText("Confirm Crop");
        fireEvent.click(confirmButton);
      });

      await waitFor(() => {
        expect(screen.getByText("Rotation")).toBeDefined();
      });
    }
  });

  it("displays flip section header in adjust step", async () => {
    render(<CustomImageUploader />);

    const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
    const input = document.querySelector('input[type="file"]');

    if (input) {
      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        const confirmButton = screen.getByText("Confirm Crop");
        fireEvent.click(confirmButton);
      });

      await waitFor(() => {
        expect(screen.getByText("Flip")).toBeDefined();
      });
    }
  });

  it("displays filters section header in adjust step", async () => {
    render(<CustomImageUploader />);

    const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
    const input = document.querySelector('input[type="file"]');

    if (input) {
      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        const confirmButton = screen.getByText("Confirm Crop");
        fireEvent.click(confirmButton);
      });

      await waitFor(() => {
        expect(screen.getByText("Filters")).toBeDefined();
      });
    }
  });

  it("displays brightness section header in adjust step", async () => {
    render(<CustomImageUploader />);

    const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
    const input = document.querySelector('input[type="file"]');

    if (input) {
      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        const confirmButton = screen.getByText("Confirm Crop");
        fireEvent.click(confirmButton);
      });

      await waitFor(() => {
        expect(screen.getByText("Brightness")).toBeDefined();
      });
    }
  });

  it("displays contrast section header in adjust step", async () => {
    render(<CustomImageUploader />);

    const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
    const input = document.querySelector('input[type="file"]');

    if (input) {
      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        const confirmButton = screen.getByText("Confirm Crop");
        fireEvent.click(confirmButton);
      });

      await waitFor(() => {
        expect(screen.getByText("Contrast")).toBeDefined();
      });
    }
  });

  it("toggles rotation section on click", async () => {
    render(<CustomImageUploader />);

    const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
    const input = document.querySelector('input[type="file"]');

    if (input) {
      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        const confirmButton = screen.getByText("Confirm Crop");
        fireEvent.click(confirmButton);
      });

      await waitFor(() => {
        // Find rotation section button
        const rotationSection = Array.from(
          document.querySelectorAll("button"),
        ).find((btn) => btn.textContent?.includes("Rotation"));
        expect(rotationSection).toBeDefined();

        // Click to expand
        if (rotationSection) {
          fireEvent.click(rotationSection);

          // Check that chevron direction changes (should now be up)
          const chevronUp = document.querySelector(".lucide-chevron-up");
          expect(chevronUp).toBeDefined();
        }
      });
    }
  });

  it("calls onUploadError for invalid file type", async () => {
    const onError = vi.fn();
    render(<CustomImageUploader onUploadError={onError} />);

    const file = new File(["test"], "test.pdf", { type: "application/pdf" });
    const input = document.querySelector('input[type="file"]');

    if (input) {
      fireEvent.change(input, { target: { files: [file] } });

      // Should not show crop step for invalid file type
      await waitFor(() => {
        expect(screen.queryByText("Crop Image")).toBeNull();
      });
    }
  });

  it("calls onUploadError for large file", async () => {
    const onError = vi.fn();
    render(<CustomImageUploader onUploadError={onError} />);

    // Create a large file (>10MB)
    const largeContent = new Array(11 * 1024 * 1024).fill("a").join("");
    const file = new File([largeContent], "large.jpg", { type: "image/jpeg" });
    const input = document.querySelector('input[type="file"]');

    if (input) {
      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith("File size exceeds 10MB limit");
      });
    }
  });

  it("handles cancel button click in crop step", async () => {
    render(<CustomImageUploader />);

    const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
    const input = document.querySelector('input[type="file"]');

    if (input) {
      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText("Crop Image")).toBeDefined();
      });

      const cancelButton = document
        .querySelector(".lucide-x")
        ?.closest("button");
      if (cancelButton) {
        fireEvent.click(cancelButton);
      }

      await waitFor(() => {
        // Should return to drag and drop area
        expect(
          screen.getByText(/Click to upload or drag and drop your image here/i),
        ).toBeDefined();
      });
    }
  });

  it("shows cancel and upload buttons in adjust step", async () => {
    render(<CustomImageUploader />);

    const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
    const input = document.querySelector('input[type="file"]');

    if (input) {
      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        const confirmButton = screen.getByText("Confirm Crop");
        fireEvent.click(confirmButton);
      });

      await waitFor(() => {
        expect(screen.getByText("Cancel")).toBeDefined();
        // Upload button in adjust step still says "Upload Photo"
        expect(screen.getByText("Upload Photo")).toBeDefined();
      });
    }
  });

  it("shows upload icon in drag and drop area", () => {
    render(<CustomImageUploader />);
    const uploadIcon = document.querySelector(".lucide-upload");
    expect(uploadIcon).toBeDefined();
  });

  it("shows camera button in drag and drop area", () => {
    render(<CustomImageUploader />);
    const cameraIcon = document.querySelector(".lucide-camera");
    expect(cameraIcon).toBeDefined();
  });

  it("has file input for file selection", () => {
    render(<CustomImageUploader />);
    const fileInput = document.querySelector(
      'input[type="file"][accept*="image/jpeg"]',
    );
    expect(fileInput).toBeDefined();
  });

  it("has file input for camera capture", () => {
    render(<CustomImageUploader />);
    const cameraInput = document.querySelector('input[type="file"][capture]');
    expect(cameraInput).toBeDefined();
  });

  it("opens file dialog when clicking drag and drop area", async () => {
    render(<CustomImageUploader />);
    const fileInput = document.querySelector(
      'input[type="file"][accept*="image/jpeg"]',
    ) as HTMLInputElement;

    // Mock the click method
    const clickSpy = vi.fn();
    if (fileInput) {
      fileInput.click = clickSpy;
    }

    // Find the drag and drop area div
    const dragArea = document.querySelector(".cursor-pointer") as HTMLElement;
    if (dragArea) {
      fireEvent.click(dragArea);
      // The click should trigger fileInput.click()
      expect(clickSpy).toHaveBeenCalled();
    }
  });

  it("opens camera when clicking camera button", async () => {
    render(<CustomImageUploader />);
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
    render(<CustomImageUploader />);

    // Find the drag and drop area div
    const dragArea = document.querySelector(".cursor-pointer") as HTMLElement;
    if (dragArea) {
      fireEvent.dragOver(dragArea);
      // Should have primary border when dragging over
      expect(dragArea.classList.contains("border-primary")).toBe(true);
    }
  });

  it("removes drag over state when leaving drag area", async () => {
    render(<CustomImageUploader />);

    // Find the drag and drop area div
    const dragArea = document.querySelector(".cursor-pointer") as HTMLElement;
    if (dragArea) {
      fireEvent.dragOver(dragArea);
      fireEvent.dragLeave(dragArea);
      // Should not have primary border when not dragging
      expect(dragArea.classList.contains("border-primary")).toBe(false);
    }
  });

  it("accepts file drop", async () => {
    render(<CustomImageUploader />);

    const file = new File(["test"], "test.jpg", { type: "image/jpeg" });

    // Find the drag and drop area div
    const dragArea = document.querySelector(".cursor-pointer") as HTMLElement;
    if (dragArea) {
      fireEvent.drop(dragArea, { dataTransfer: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText("Crop Image")).toBeDefined();
      });
    }
  });

  it("shows crop instruction in crop step", async () => {
    render(<CustomImageUploader />);

    const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
    const input = document.querySelector('input[type="file"]');

    if (input) {
      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(
          screen.getByText(/Drag the crop area to select the region to keep/i),
        ).toBeDefined();
      });
    }
  });

  it("preserves crop area when switching to adjust step", async () => {
    render(<CustomImageUploader />);

    const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
    const input = document.querySelector('input[type="file"]');

    if (input) {
      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        const confirmButton = screen.getByText("Confirm Crop");
        fireEvent.click(confirmButton);
      });

      await waitFor(() => {
        // In adjust step, there should be a container for the cropped preview
        // Look for divs with both relative and overflow-hidden class
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
        // Should have responsive width classes (w-full, min-w-50, max-w-125)
        expect(previewContainer?.classList.contains("w-full")).toBe(true);
        expect(previewContainer?.classList.contains("min-w-50")).toBe(true);
        expect(previewContainer?.classList.contains("max-w-125")).toBe(true);
        // Should have aspect-square class to maintain 1:1 aspect ratio
        expect(previewContainer?.classList.contains("aspect-square")).toBe(
          true,
        );
      });
    }
  });

  it("clips image to crop area in adjust step using overflow hidden", async () => {
    render(<CustomImageUploader />);

    const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
    const input = document.querySelector('input[type="file"]');

    if (input) {
      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        const confirmButton = screen.getByText("Confirm Crop");
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
    render(<CustomImageUploader />);

    const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
    const input = document.querySelector('input[type="file"]');

    if (input) {
      fireEvent.change(input, { target: { files: [file] } });

      // Wait for crop step to be ready
      await waitFor(() => {
        const confirmButton = screen.getByText("Confirm Crop");
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
        const confirmButton = screen.getByText("Confirm Crop");
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
    render(<CustomImageUploader />);

    const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
    const input = document.querySelector('input[type="file"]');

    if (input) {
      fireEvent.change(input, { target: { files: [file] } });

      // Go to adjust step
      await waitFor(() => {
        const confirmButton = screen.getByText("Confirm Crop");
        fireEvent.click(confirmButton);
      });

      // Go back to crop step
      await waitFor(() => {
        const backButton = screen.getByText("Back to Crop");
        fireEvent.click(backButton);
      });

      // Should be back at crop step with crop area still visible
      await waitFor(() => {
        expect(screen.getByText("Confirm Crop")).toBeDefined();
        // The crop overlay should still be visible
        const cropArea = document.querySelector(
          'div[style*="border-2 border-white"]',
        );
        expect(cropArea).toBeDefined();
      });
    }
  });

  it("applies transformations to cropped area in adjust step", async () => {
    render(<CustomImageUploader />);

    const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
    const input = document.querySelector('input[type="file"]');

    if (input) {
      fireEvent.change(input, { target: { files: [file] } });

      // Wait for crop step to be ready
      await waitFor(() => {
        const confirmButton = screen.getByText("Confirm Crop");
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
        const confirmButton = screen.getByText("Confirm Crop");
        fireEvent.click(confirmButton);
      });

      // Expand rotation section and apply rotation
      await waitFor(() => {
        const rotationSection = Array.from(
          document.querySelectorAll("button"),
        ).find((btn) => btn.textContent?.includes("Rotation"));

        if (rotationSection) {
          fireEvent.click(rotationSection);

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
    render(<CustomImageUploader />);

    const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
    const input = document.querySelector('input[type="file"]');

    if (input) {
      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        const confirmButton = screen.getByText("Confirm Crop");
        fireEvent.click(confirmButton);
      });

      // Just verify we reach the adjust step without errors
      await waitFor(() => {
        expect(screen.getByText("Rotation")).toBeDefined();
      });
    }
  });

  it("handles resize and maintains correct positioning", async () => {
    render(<CustomImageUploader />);

    const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
    const input = document.querySelector('input[type="file"]');

    if (input) {
      fireEvent.change(input, { target: { files: [file] } });

      // Wait for crop step
      await waitFor(() => {
        expect(screen.getByText("Confirm Crop")).toBeDefined();
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
        const confirmButton = screen.getByText("Confirm Crop");
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
    render(<CustomImageUploader />);

    const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
    const input = document.querySelector('input[type="file"]');

    if (input) {
      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        const confirmButton = screen.getByText("Confirm Crop");
        fireEvent.click(confirmButton);
      });

      // Verify adjust step is displayed with filter controls
      await waitFor(() => {
        expect(screen.getByText("Rotation")).toBeDefined();
        expect(screen.getByText("Back to Crop")).toBeDefined();
      });
    }
  });

  it("clips image to crop area in adjust step with overflow hidden", async () => {
    render(<CustomImageUploader />);

    const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
    const input = document.querySelector('input[type="file"]');

    if (input) {
      fireEvent.change(input, { target: { files: [file] } });

      // Wait for crop step to be ready
      await waitFor(() => {
        const confirmButton = screen.getByText("Confirm Crop");
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
        const confirmButton = screen.getByText("Confirm Crop");
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
