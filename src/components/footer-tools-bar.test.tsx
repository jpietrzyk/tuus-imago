import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { FooterToolsBar, type FooterToolsBarProps } from "./footer-tools-bar";
import { t } from "@/locales/i18n";
import type { SelectedImageItem } from "@/components/image-uploader/image-uploader";

vi.mock("@/components/image-uploader/uploader-tools", () => ({
  UploaderTools: ({
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

vi.mock("@/components/image-uploader/uploader-slot-switcher", () => ({
  UploaderSlotSwitcher: ({
    slots,
    onSelectSlot,
    hidden,
  }: {
    slots: Array<SelectedImageItem | null>;
    onSelectSlot: (index: number) => void;
    hidden?: boolean;
  }) => (
    <div data-testid="mock-slot-switcher" hidden={hidden}>
      {slots.map((_, i) => (
        <button key={i} onClick={() => onSelectSlot(i)}>
          Slot {i}
        </button>
      ))}
    </div>
  ),
}));

vi.mock("@/components/image-uploader/uploader-effects-panel", () => ({
  UploaderEffectsPanelButton: ({
    disabled,
    onEnterEditMode,
  }: {
    disabled?: boolean;
    isEditMode: boolean;
    onEnterEditMode: () => void;
  }) => (
    <button
      data-testid="mock-effects-button"
      disabled={disabled}
      onClick={onEnterEditMode}
    >
      {t("uploader.previewEffectsButton")}
    </button>
  ),
}));

const createImageItem = (name: string): SelectedImageItem => ({
  file: new File([name], `${name}.jpg`, { type: "image/jpeg" }),
  previewUrl: `blob:${name}`,
  metadata: null,
  displayImageProportion: "horizontal",
  autoSelectOptimalPending: false,
  previewEffects: { brightness: 0, contrast: 0, grayscale: 0 },
  previewTransform: { rotation: 0, flipHorizontal: false, flipVertical: false },
});

const createProps = (): FooterToolsBarProps => ({
  slots: [createImageItem("slot1"), null, null],
  activeSlotIndex: 0,
  onSelectSlot: vi.fn(),
  onSplitImage: vi.fn(),
  canSplitImage: true,
  shouldConfirmSplit: false,
  onSelectProportion: vi.fn(),
  selectedProportion: "horizontal",
  canUpdateEffects: true,
  isEditMode: false,
  onEnterEditMode: vi.fn(),
});

describe("FooterToolsBar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders slot switcher, split button, effects button, and tools", () => {
    const props = createProps();
    render(<FooterToolsBar {...props} />);

    expect(screen.getByTestId("mock-slot-switcher")).toBeInTheDocument();
    expect(screen.getByTestId("mock-uploader-tools")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: t("uploader.splitSelectedImage") }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("mock-effects-button")).toBeInTheDocument();
  });

  it("enables split button when canSplitImage is true", () => {
    const props = createProps();
    render(<FooterToolsBar {...props} />);

    const splitButton = screen.getByRole("button", {
      name: t("uploader.splitSelectedImage"),
    });
    expect(splitButton).not.toBeDisabled();
  });

  it("disables split button when canSplitImage is false", () => {
    const props = createProps();
    render(<FooterToolsBar {...props} canSplitImage={false} />);

    const splitButton = screen.getByRole("button", {
      name: t("uploader.splitSelectedImage"),
    });
    expect(splitButton).toBeDisabled();
  });

  it("calls onSplitImage when split button is clicked", () => {
    const onSplitImage = vi.fn();
    const props = createProps();
    render(<FooterToolsBar {...props} onSplitImage={onSplitImage} />);

    const splitButton = screen.getByRole("button", {
      name: t("uploader.splitSelectedImage"),
    });
    fireEvent.click(splitButton);

    expect(onSplitImage).toHaveBeenCalled();
  });

  it("enables effects button when canUpdateEffects is true", () => {
    const props = createProps();
    render(<FooterToolsBar {...props} />);

    const effectsButton = screen.getByTestId("mock-effects-button");
    expect(effectsButton).not.toBeDisabled();
  });

  it("disables effects button when canUpdateEffects is false", () => {
    const props = createProps();
    render(<FooterToolsBar {...props} canUpdateEffects={false} />);

    const effectsButton = screen.getByTestId("mock-effects-button");
    expect(effectsButton).toBeDisabled();
  });

  it("calls onEnterEditMode when effects button is clicked", () => {
    const onEnterEditMode = vi.fn();
    const props = createProps();
    render(<FooterToolsBar {...props} onEnterEditMode={onEnterEditMode} />);

    const effectsButton = screen.getByTestId("mock-effects-button");
    fireEvent.click(effectsButton);

    expect(onEnterEditMode).toHaveBeenCalled();
  });

  it("calls onSelectSlot when slot switcher slot is clicked", () => {
    const onSelectSlot = vi.fn();
    const props = createProps();
    render(<FooterToolsBar {...props} onSelectSlot={onSelectSlot} />);

    const slotButton = screen.getByRole("button", { name: /Slot 1/i });
    fireEvent.click(slotButton);

    expect(onSelectSlot).toHaveBeenCalledWith(1);
  });

  it("calls onSelectProportion when proportion is selected from tools", () => {
    const onSelectProportion = vi.fn();
    const props = createProps();
    render(
      <FooterToolsBar {...props} onSelectProportion={onSelectProportion} />,
    );

    const proportionButton = screen.getByRole("button", {
      name: /Proportion/i,
    });
    fireEvent.click(proportionButton);

    expect(onSelectProportion).toHaveBeenCalledWith("horizontal");
  });

  it("hides slot switcher when isEditMode is true", () => {
    const props = createProps();
    render(<FooterToolsBar {...props} isEditMode={true} />);

    const slotSwitcher = screen.getByTestId("mock-slot-switcher");
    expect(slotSwitcher).toHaveAttribute("hidden");
  });

  it("shows split confirmation dialog when shouldConfirmSplit is true", () => {
    const props = createProps();
    render(<FooterToolsBar {...props} shouldConfirmSplit={true} />);

    const splitButton = screen.getByRole("button", {
      name: t("uploader.splitSelectedImage"),
    });
    fireEvent.click(splitButton);

    expect(
      screen.getByText(t("uploader.splitSlotsConfirmTitle")),
    ).toBeInTheDocument();
  });
});
