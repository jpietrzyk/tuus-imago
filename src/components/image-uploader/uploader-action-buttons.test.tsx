import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { UploaderActionButtons } from "./uploader-action-buttons";

describe("UploaderActionButtons", () => {
  it("renders both upload and camera buttons with accessible labels", () => {
    const noop = () => {};
    render(<UploaderActionButtons onUploadClick={noop} onCameraClick={noop} />);

    const uploadBtn = screen.getByLabelText("Upload from device");
    const cameraBtn = screen.getByLabelText("Open camera");

    expect(uploadBtn).toBeInTheDocument();
    expect(cameraBtn).toBeInTheDocument();

    expect(document.querySelector(".lucide-upload")).toBeTruthy();
    expect(document.querySelector(".lucide-camera")).toBeTruthy();
  });

  it("renders default text below icons", () => {
    const noop = () => {};
    render(<UploaderActionButtons onUploadClick={noop} onCameraClick={noop} />);

    expect(screen.getByText("Upload from device")).toBeInTheDocument();
    expect(screen.getByText("Take photo")).toBeInTheDocument();
  });

  it("renders custom text props when provided", () => {
    const noop = () => {};
    render(
      <UploaderActionButtons
        onUploadClick={noop}
        onCameraClick={noop}
        uploadText="Select from gallery"
        cameraText="Use camera"
      />,
    );

    expect(screen.getByText("Select from gallery")).toBeInTheDocument();
    expect(screen.getByText("Use camera")).toBeInTheDocument();
    expect(screen.queryByText("Upload from device")).not.toBeInTheDocument();
    expect(screen.queryByText("Take photo")).not.toBeInTheDocument();
  });

  it("fires callbacks when buttons are clicked", () => {
    const onUploadClick = vi.fn();
    const onCameraClick = vi.fn();
    render(
      <UploaderActionButtons
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
});
