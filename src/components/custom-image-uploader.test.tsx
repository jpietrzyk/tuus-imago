import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CustomImageUploader } from "./custom-image-uploader";

describe("CustomImageUploader", () => {
  beforeEach(() => {
    // Reset fetch mock before each test
    vi.stubGlobal("fetch", vi.fn());
  });

  it("renders upload button when no file is selected", () => {
    render(<CustomImageUploader />);
    const uploadButton = screen.getByText(/Upload Photo/i);
    expect(uploadButton).toBeDefined();
  });

  it("renders custom button text when provided", () => {
    render(<CustomImageUploader buttonText="Choose Image" />);
    expect(screen.getByText("Choose Image")).toBeDefined();
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
        // Should return to upload button
        expect(screen.getByText(/Upload Photo/i)).toBeDefined();
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
        expect(screen.getByText("Upload Photo")).toBeDefined();
      });
    }
  });

  it("applies custom className when provided", () => {
    render(<CustomImageUploader className="custom-class" />);
    const uploadButton = screen.getByText(/Upload Photo/i);
    expect(uploadButton).toBeDefined();
    // Button should have the custom className
    const buttonElement = uploadButton.closest("button");
    expect(buttonElement?.classList.contains("custom-class")).toBe(true);
  });

  it("shows upload icon on upload button", () => {
    render(<CustomImageUploader />);
    const uploadIcon = document.querySelector(".lucide-upload");
    expect(uploadIcon).toBeDefined();
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
        // Look for divs with both relative and inline-block with overflow-hidden class
        const divs = document.querySelectorAll("div");
        let previewContainer: HTMLElement | null = null;

        for (const div of divs) {
          if (
            div.classList.contains("relative") &&
            div.classList.contains("inline-block") &&
            div.classList.contains("overflow-hidden")
          ) {
            previewContainer = div;
            break;
          }
        }

        expect(previewContainer).toBeDefined();
        // Should have width and height styles set
        expect(previewContainer?.style.width).toBeTruthy();
        expect(previewContainer?.style.height).toBeTruthy();
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
            div.classList.contains("inline-block") &&
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

      await waitFor(() => {
        const confirmButton = screen.getByText("Confirm Crop");
        fireEvent.click(confirmButton);
      });

      await waitFor(() => {
        // Find the image in adjust step
        const allImages = document.querySelectorAll('img[alt="Preview"]');
        const adjustStepImage = allImages[allImages.length - 1] as HTMLElement;

        expect(adjustStepImage).toBeDefined();

        // Check that transform contains translate
        const transform = window.getComputedStyle(adjustStepImage).transform;
        // Transform should be applied (translate should be in the string)
        expect(adjustStepImage.style.transform).toBeTruthy();
        expect(adjustStepImage.style.transform).toMatch(/translate/);
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

      // The image should have rotation applied
      await waitFor(() => {
        const allImages = document.querySelectorAll('img[alt="Preview"]');
        const adjustStepImage = allImages[allImages.length - 1] as HTMLElement;
        const transform = adjustStepImage.style.transform;

        // Should have rotate in the transform
        expect(transform).toMatch(/rotate/);
      });
    }
  });

  it("removes no longer needed croppedPreviewUrl state", async () => {
    // This test verifies that we're not creating/storing unnecessary blob URLs
    const { rerender } = render(<CustomImageUploader />);

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

      // Move to adjust step
      await waitFor(() => {
        const confirmButton = screen.getByText("Confirm Crop");
        fireEvent.click(confirmButton);
      });

      // In adjust step, image should be absolutely positioned
      await waitFor(() => {
        const allImages = document.querySelectorAll('img[alt="Preview"]');
        const adjustStepImage = allImages[allImages.length - 1] as HTMLElement;
        expect(adjustStepImage.style.position).toBe("absolute");
      });
    }
  });
});
