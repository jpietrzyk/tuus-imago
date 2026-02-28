import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { UploadActionButtons } from "./upload-action-buttons";

describe("UploadActionButtons", () => {
  it("renders both upload and camera buttons with accessible labels", () => {
    const noop = () => {};
    render(
      <UploadActionButtons onUploadClick={noop} onCameraClick={noop} />,
    );

    const uploadBtn = screen.getByLabelText("Upload from device");
    const cameraBtn = screen.getByLabelText("Open camera");

    expect(uploadBtn).toBeInTheDocument();
    expect(cameraBtn).toBeInTheDocument();

    // Icons presence (optional, ensures correct icons exist)
    expect(document.querySelector(".lucide-upload")).toBeTruthy();
    expect(document.querySelector(".lucide-camera")).toBeTruthy();
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
    render(
      <UploadActionButtons onUploadClick={noop} onCameraClick={noop} />,
    );

    const uploadBtn = screen.getByLabelText("Upload from device");
    const cameraBtn = screen.getByLabelText("Open camera");

    // Check class names contain dashed border classes
    expect(uploadBtn.className).toMatch(/border-2/);
    expect(uploadBtn.className).toMatch(/border-dashed/);
    expect(cameraBtn.className).toMatch(/border-2/);
    expect(cameraBtn.className).toMatch(/border-dashed/);
  });
});
