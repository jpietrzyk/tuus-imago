import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { UploadActionButtons } from "./upload-action-buttons";

describe("UploadActionButtons", () => {
  it("renders both upload and camera buttons with accessible labels", () => {
    const noop = () => {};
    render(<UploadActionButtons onUploadClick={noop} onCameraClick={noop} />);

    const uploadBtn = screen.getByLabelText("Upload from device");
    const cameraBtn = screen.getByLabelText("Open camera");

    expect(uploadBtn).toBeInTheDocument();
    expect(cameraBtn).toBeInTheDocument();

    // Icons presence (optional, ensures correct icons exist)
    expect(document.querySelector(".lucide-upload")).toBeTruthy();
    expect(document.querySelector(".lucide-camera")).toBeTruthy();
  });

  it("renders default text below icons", () => {
    const noop = () => {};
    render(<UploadActionButtons onUploadClick={noop} onCameraClick={noop} />);

    // Check default upload button text
    expect(screen.getByText("Upload from device")).toBeInTheDocument();

    // Check default camera button text
    expect(screen.getByText("Take photo")).toBeInTheDocument();
  });

  it("renders custom text props when provided", () => {
    const noop = () => {};
    render(
      <UploadActionButtons
        onUploadClick={noop}
        onCameraClick={noop}
        uploadText="Select from gallery"
        cameraText="Use camera"
      />,
    );

    // Check custom upload button text
    expect(screen.getByText("Select from gallery")).toBeInTheDocument();

    // Check custom camera button text
    expect(screen.getByText("Use camera")).toBeInTheDocument();

    // Ensure default text is not present
    expect(screen.queryByText("Upload from device")).not.toBeInTheDocument();
    expect(screen.queryByText("Take photo")).not.toBeInTheDocument();
  });

  it("fires callbacks when buttons are clicked", () => {
    const onUploadClick = vi.fn();
    const onCameraClick = vi.fn();
    render(
      <UploadActionButtons
        onUploadClick={onUploadClick}
        onCameraClick={onCameraClick}
      />,
    );

    const uploadBtn = screen.getByLabelText("Upload from device");
    const cameraBtn = screen.getByLabelText("Open camera");

    fireEvent.click(uploadBtn);
    fireEvent.click(cameraBtn);

    expect(onUploadClick).toHaveBeenCalledTimes(1);
    expect(onCameraClick).toHaveBeenCalledTimes(1);
  });

  it("applies dashed borders on each button (non-functional style assertion)", () => {
    const noop = () => {};
    render(<UploadActionButtons onUploadClick={noop} onCameraClick={noop} />);

    const uploadBtn = screen.getByLabelText("Upload from device");
    const cameraBtn = screen.getByLabelText("Open camera");

    // Check class names contain dashed border classes
    expect(uploadBtn.className).toMatch(/border-2/);
    expect(uploadBtn.className).toMatch(/border-dashed/);
    expect(cameraBtn.className).toMatch(/border-2/);
    expect(cameraBtn.className).toMatch(/border-dashed/);
  });

  it("applies flex-col layout for vertical text arrangement", () => {
    const noop = () => {};
    render(<UploadActionButtons onUploadClick={noop} onCameraClick={noop} />);

    const uploadBtn = screen.getByLabelText("Upload from device");
    const cameraBtn = screen.getByLabelText("Open camera");

    // Check that buttons have flex-col class for vertical layout
    expect(uploadBtn.className).toMatch(/flex-col/);
    expect(cameraBtn.className).toMatch(/flex-col/);
  });

  it("applies small text size for text labels", () => {
    const noop = () => {};
    render(<UploadActionButtons onUploadClick={noop} onCameraClick={noop} />);

    // Get all text elements (should be 2: 1 below each icon)
    const textElements = document.querySelectorAll(".text-xs");
    expect(textElements.length).toBe(2);

    // Verify they have font-medium class
    textElements.forEach((element) => {
      expect(element.className).toMatch(/font-medium/);
    });
  });

  it("applies margin top to text for spacing below icon", () => {
    const noop = () => {};
    render(<UploadActionButtons onUploadClick={noop} onCameraClick={noop} />);

    // Get all text elements
    const textElements = document.querySelectorAll(".text-xs");

    // Verify they have mt-2 class for margin top
    textElements.forEach((element) => {
      expect(element.className).toMatch(/mt-2/);
    });
  });
});
