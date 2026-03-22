import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { UploaderPreviewToolsPanel } from "./uploader-preview-tools-panel";
import { t } from "@/locales/i18n";
import type { SelectedImageItem } from "./image-uploader";

vi.mock("./uploader-tools", () => ({
  default: ({
    onSelectProportion,
  }: {
    onSelectProportion: (p: string) => void;
  }) => (
    <div data-testid="mock-uploader-tools">
      <button onClick={() => onSelectProportion("horizontal")}>
        Proportion
      </button>
    </div>
  ),
}));

vi.mock("./uploader-slot-switcher", () => ({
  default: ({
    slots,
    onSelectSlot,
  }: {
    slots: Array<SelectedImageItem | null>;
    onSelectSlot: (index: number) => void;
  }) => (
    <div data-testid="mock-slot-switcher">
      {slots.map((_, i) => (
        <button key={i} onClick={() => onSelectSlot(i)}>
          Slot {i}
        </button>
      ))}
    </div>
  ),
}));

const createImageItem = (name: string): SelectedImageItem => ({
  file: new File([name], `${name}.jpg`, { type: "image/jpeg" }),
  previewUrl: `blob:${name}`,
  metadata: null,
  displayImageProportion: "horizontal",
  autoSelectOptimalPending: false,
  previewEffects: { brightness: 0, contrast: 0 },
});

const createProps = () => ({
  slots: [createImageItem("slot1"), null, null],
  activeSlotIndex: 0,
  onSelectSlot: vi.fn(),
  onSplitImage: vi.fn(),
  canSplitImage: true,
  shouldConfirmSplit: false,
  onSelectProportion: vi.fn(),
  onUpdateEffect: vi.fn(),
  onResetEffects: vi.fn(),
  activeImageEffects: { brightness: 0, contrast: 0 },
  canUpdateEffects: true,
  selectedProportion: "horizontal" as const,
});

describe("UploaderPreviewToolsPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders slot switcher, split button, effects button, and tools", () => {
    const props = createProps();
    render(<UploaderPreviewToolsPanel {...props} />);

    expect(screen.getByTestId("mock-slot-switcher")).toBeInTheDocument();
    expect(screen.getByTestId("mock-uploader-tools")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: t("uploader.splitSelectedImage") }),
    ).toBeInTheDocument();
  });

  it("enables split button when canSplitImage is true", () => {
    const props = createProps();
    render(<UploaderPreviewToolsPanel {...props} />);

    const splitButton = screen.getByRole("button", {
      name: t("uploader.splitSelectedImage"),
    });
    expect(splitButton).not.toBeDisabled();
  });

  it("disables split button when canSplitImage is false", () => {
    const props = createProps();
    render(<UploaderPreviewToolsPanel {...props} canSplitImage={false} />);

    const splitButton = screen.getByRole("button", {
      name: t("uploader.splitSelectedImage"),
    });
    expect(splitButton).toBeDisabled();
  });

  it("calls onSplitImage when split button is clicked", () => {
    const onSplitImage = vi.fn();
    const props = createProps();

    render(
      <UploaderPreviewToolsPanel {...props} onSplitImage={onSplitImage} />,
    );

    const splitButton = screen.getByRole("button", {
      name: t("uploader.splitSelectedImage"),
    });
    fireEvent.click(splitButton);

    expect(onSplitImage).toHaveBeenCalled();
  });

  it("enables effects button when canUpdateEffects is true", () => {
    const props = createProps();
    render(<UploaderPreviewToolsPanel {...props} />);

    const effectsButton = screen.getByRole("button", {
      name: t("uploader.previewEffectsButton"),
    });
    expect(effectsButton).not.toBeDisabled();
  });

  it("disables effects button when canUpdateEffects is false", () => {
    const props = createProps();
    render(<UploaderPreviewToolsPanel {...props} canUpdateEffects={false} />);

    const effectsButton = screen.getByRole("button", {
      name: t("uploader.previewEffectsButton"),
    });
    expect(effectsButton).toBeDisabled();
  });

  it("calls onSelectSlot when slot switcher slot is clicked", () => {
    const onSelectSlot = vi.fn();
    const props = createProps();

    render(
      <UploaderPreviewToolsPanel {...props} onSelectSlot={onSelectSlot} />,
    );

    const slotButton = screen.getByRole("button", { name: /Slot 1/i });
    fireEvent.click(slotButton);

    expect(onSelectSlot).toHaveBeenCalledWith(1);
  });

  it("calls onSelectProportion when proportion is selected from tools", () => {
    const onSelectProportion = vi.fn();
    const props = createProps();

    render(
      <UploaderPreviewToolsPanel
        {...props}
        onSelectProportion={onSelectProportion}
      />,
    );

    const proportionButton = screen.getByRole("button", {
      name: /Proportion/i,
    });
    fireEvent.click(proportionButton);

    expect(onSelectProportion).toHaveBeenCalledWith("horizontal");
  });

  it("shows split confirmation dialog when shouldConfirmSplit is true", () => {
    const props = createProps();
    render(<UploaderPreviewToolsPanel {...props} shouldConfirmSplit={true} />);

    const splitButton = screen.getByRole("button", {
      name: t("uploader.splitSelectedImage"),
    });
    fireEvent.click(splitButton);

    // Dialog should appear
    expect(
      screen.getByText(t("uploader.splitSlotsConfirmTitle")),
    ).toBeInTheDocument();
  });
});
