import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { UploaderDropArea } from "./uploader-drop-area";

vi.mock("@/locales/i18n", () => ({
  t: (key: string) => key,
}));

vi.mock("@/lib/utils", () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(" "),
}));

vi.mock("./uploader-action-buttons", () => ({
  default: () => <div data-testid="action-buttons" />,
}));

function createRefs() {
  return {
    fileInputRef: { current: null } as React.RefObject<HTMLInputElement | null>,
    cameraInputRef: { current: null } as React.RefObject<HTMLInputElement | null>,
  };
}

const defaultProps = {
  showIcons: false,
  onFileSelect: vi.fn(),
  onDragOver: vi.fn(),
  onDragLeave: vi.fn(),
  onDrop: vi.fn(),
  onShowIcons: vi.fn(),
};

describe("UploaderDropArea", () => {
  it("renders upload button with t key when showIcons=false", () => {
    const refs = createRefs();
    render(<UploaderDropArea {...defaultProps} {...refs} />);
    expect(screen.getByText("upload.clickToUpload")).toBeInTheDocument();
  });

  it("renders action buttons when showIcons=true", () => {
    const refs = createRefs();
    render(<UploaderDropArea {...defaultProps} {...refs} showIcons />);
    expect(screen.getByTestId("action-buttons")).toBeInTheDocument();
    expect(screen.queryByText("upload.clickToUpload")).not.toBeInTheDocument();
  });

  it("calls onShowIcons when upload button is clicked", () => {
    const onShowIcons = vi.fn();
    const refs = createRefs();
    render(<UploaderDropArea {...defaultProps} {...refs} onShowIcons={onShowIcons} />);
    fireEvent.click(screen.getByText("upload.clickToUpload"));
    expect(onShowIcons).toHaveBeenCalledOnce();
  });

  it("attaches file input refs", () => {
    const refs = createRefs();
    render(<UploaderDropArea {...defaultProps} {...refs} />);
    expect(refs.fileInputRef.current).toBeInstanceOf(HTMLInputElement);
    expect(refs.cameraInputRef.current).toBeInstanceOf(HTMLInputElement);
  });

  it("forwards drag events", () => {
    const onDragOver = vi.fn();
    const onDragLeave = vi.fn();
    const onDrop = vi.fn();
    const refs = createRefs();
    const { container } = render(
      <UploaderDropArea
        {...defaultProps}
        {...refs}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      />,
    );
    const div = container.firstElementChild as HTMLElement;
    fireEvent.dragOver(div);
    expect(onDragOver).toHaveBeenCalledOnce();
    fireEvent.dragLeave(div);
    expect(onDragLeave).toHaveBeenCalledOnce();
    fireEvent.drop(div);
    expect(onDrop).toHaveBeenCalledOnce();
  });
});
