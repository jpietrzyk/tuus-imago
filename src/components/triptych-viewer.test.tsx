import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { TriptychViewer } from "./triptych-viewer";

class MockImage {
  onload: (() => void) | null = null;
  set src(_value: string) {
    this.onload?.();
  }
}

describe("TriptychViewer Component", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("should render empty state placeholder when no image is provided", () => {
    render(<TriptychViewer />);

    expect(
      screen.getByText("Load an image to display it here with mask and A/B/C parts"),
    ).toBeInTheDocument();
  });

  it("should render custom empty state when provided", () => {
    render(<TriptychViewer imageSrc={null} emptyState={<div>No image yet</div>} />);

    expect(screen.getByText("No image yet")).toBeInTheDocument();
  });

  it("should render provided image src and hide empty state", () => {
    render(<TriptychViewer imageSrc="https://example.com/photo.jpg" />);

    const image = screen.getByAltText("triptych");
    expect(image).toHaveAttribute("src", "https://example.com/photo.jpg");
    expect(
      screen.queryByText("Load an image to display it here with mask and A/B/C parts"),
    ).not.toBeInTheDocument();
  });

  it("should render mask part markers and preview slots after image load", () => {
    render(<TriptychViewer imageSrc="blob:mock-image" />);

    fireEvent.load(screen.getByAltText("triptych"));

    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("B")).toBeInTheDocument();
    expect(screen.getByText("C")).toBeInTheDocument();
    expect(screen.getAllByText("A'").length).toBeGreaterThan(0);
    expect(screen.getAllByText("B'").length).toBeGreaterThan(0);
    expect(screen.getAllByText("C'").length).toBeGreaterThan(0);
  });

  it("should notify image src change when a file is loaded", () => {
    vi.spyOn(window.URL, "createObjectURL").mockReturnValue("blob:loaded-image");
    const onImageSrcChange = vi.fn();
    render(<TriptychViewer imageSrc={null} onImageSrcChange={onImageSrcChange} />);

    const input = document.querySelector('input[type="file"]');
    expect(input).not.toBeNull();
    fireEvent.change(input as HTMLInputElement, {
      target: { files: [new File(["data"], "photo.jpg", { type: "image/jpeg" })] },
    });

    expect(onImageSrcChange).toHaveBeenCalledWith("blob:loaded-image");
  });

  it("should notify part shape, coverage and slot scale changes", () => {
    const onPartShapeChange = vi.fn();
    const onCoverageChange = vi.fn();
    const onSlotScaleChange = vi.fn();
    render(
      <TriptychViewer
        partShape="portrait"
        coverage={1}
        slotScale={2}
        onPartShapeChange={onPartShapeChange}
        onCoverageChange={onCoverageChange}
        onSlotScaleChange={onSlotScaleChange}
      />,
    );

    fireEvent.change(screen.getByLabelText("Part shape:"), { target: { value: "square" } });
    fireEvent.change(screen.getByLabelText("Coverage:"), { target: { value: "0.8" } });
    fireEvent.change(screen.getByLabelText("Slot size:"), { target: { value: "3" } });

    expect(onPartShapeChange).toHaveBeenCalledWith("square");
    expect(onCoverageChange).toHaveBeenCalledWith(0.8);
    expect(onSlotScaleChange).toHaveBeenCalledWith(3);
  });

  it("should reflect controlled part shape value", () => {
    render(<TriptychViewer imageSrc={null} partShape="landscape" />);

    expect(screen.getByLabelText("Part shape:")).toHaveValue("landscape");
  });

  it("should hide image loader and controls when disabled", () => {
    render(<TriptychViewer imageSrc={null} showImageLoader={false} showControls={false} />);

    expect(screen.queryByText("Load image")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Part shape:")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Coverage:")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Slot size:")).not.toBeInTheDocument();
  });

  it("should render fit preview switch on by default", () => {
    render(<TriptychViewer imageSrc={null} />);

    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true");
  });

  it("should notify fit to container change when switch is toggled", () => {
    const onFitToContainerChange = vi.fn();
    render(
      <TriptychViewer
        imageSrc={null}
        onFitToContainerChange={onFitToContainerChange}
      />,
    );

    fireEvent.click(screen.getByRole("switch"));

    expect(onFitToContainerChange).toHaveBeenCalledWith(false);
  });

  it("should reflect controlled fit to container value", () => {
    render(<TriptychViewer imageSrc={null} fitToContainer={true} />);

    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true");
  });

  it("should constrain image with proportional fit style when enabled", () => {
    render(<TriptychViewer imageSrc="blob:mock-image" fitToContainer={true} />);

    expect(screen.getByAltText("triptych")).toHaveStyle({
      maxWidth: "100%",
      height: "auto",
    });
  });

  it("should keep natural image size when fit is disabled", () => {
    render(<TriptychViewer imageSrc="blob:mock-image" fitToContainer={false} />);

    expect(screen.getByAltText("triptych")).toHaveStyle({
      maxWidth: "none",
    });
  });

  it("should notify crops change with generated crop data urls", async () => {
    vi.stubGlobal("Image", MockImage);
    const toDataURLMock = vi
      .spyOn(HTMLCanvasElement.prototype, "toDataURL")
      .mockReturnValue("data:image/jpeg;base64,mock");
    const onCropsChange = vi.fn();
    render(<TriptychViewer imageSrc="blob:mock-image" onCropsChange={onCropsChange} />);

    fireEvent.load(screen.getByAltText("triptych"));

    await waitFor(() =>
      expect(onCropsChange).toHaveBeenCalledWith([
        "data:image/jpeg;base64,mock",
        "data:image/jpeg;base64,mock",
        "data:image/jpeg;base64,mock",
      ]),
    );
    expect(toDataURLMock).toHaveBeenCalled();
  });
});
