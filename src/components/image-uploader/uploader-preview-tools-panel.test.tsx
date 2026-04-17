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
  onToggleRemoveBackground: vi.fn(),
  onToggleEnhance: vi.fn(),
  activeImageEffects: { brightness: 0, contrast: 0 },
  canUpdateEffects: true,
  selectedProportion: "horizontal" as const,
});

describe("UploaderPreviewToolsPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders slot switcher, split button, effects button, and tools in normal mode", () => {
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

    expect(
      screen.getByText(t("uploader.splitSlotsConfirmTitle")),
    ).toBeInTheDocument();
  });

  it("does not show effects drawer by default", () => {
    const props = createProps();
    render(<UploaderPreviewToolsPanel {...props} />);

    expect(
      screen.queryByRole("button", { name: t("uploader.effectsCancel") }),
    ).not.toBeInTheDocument();
  });

  it("opens drawer with effects controls when cog button is clicked", () => {
    const props = createProps();
    render(<UploaderPreviewToolsPanel {...props} />);

    const effectsButton = screen.getByRole("button", {
      name: t("uploader.previewEffectsButton"),
    });
    fireEvent.click(effectsButton);

    expect(
      screen.getByRole("button", { name: t("uploader.effectsCancel") }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: t("uploader.effectsApprove") }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: t("uploader.effectsReset") }),
    ).toBeInTheDocument();
  });

  it("keeps toolbar buttons visible when drawer is open", () => {
    const onSplitImage = vi.fn();
    const props = createProps();
    render(
      <UploaderPreviewToolsPanel {...props} onSplitImage={onSplitImage} />,
    );

    const splitButtonBefore = screen.getByRole("button", {
      name: t("uploader.splitSelectedImage"),
    });
    expect(splitButtonBefore).toBeInTheDocument();

    const effectsButton = screen.getByRole("button", {
      name: t("uploader.previewEffectsButton"),
    });
    fireEvent.click(effectsButton);

    expect(splitButtonBefore).toBeInTheDocument();
    expect(screen.getByTestId("mock-uploader-tools")).toBeInTheDocument();
  });

  it("hides slot switcher when drawer is open", () => {
    const props = createProps();
    render(<UploaderPreviewToolsPanel {...props} />);

    const effectsButton = screen.getByRole("button", {
      name: t("uploader.previewEffectsButton"),
    });
    fireEvent.click(effectsButton);

    const slotSwitcher = screen.getByTestId("mock-slot-switcher");
    expect(slotSwitcher).toHaveAttribute("hidden");
  });

  it("exits edit mode when cancel button is clicked", () => {
    const onEditModeChange = vi.fn();
    const props = createProps();
    render(
      <UploaderPreviewToolsPanel
        {...props}
        onEditModeChange={onEditModeChange}
      />,
    );

    const effectsButton = screen.getByRole("button", {
      name: t("uploader.previewEffectsButton"),
    });
    fireEvent.click(effectsButton);
    expect(onEditModeChange).toHaveBeenCalledWith(true);

    const cancelButton = screen.getByRole("button", {
      name: t("uploader.effectsCancel"),
    });
    fireEvent.click(cancelButton);
    expect(onEditModeChange).toHaveBeenCalledWith(false);

    expect(
      screen.queryByRole("button", { name: t("uploader.effectsCancel") }),
    ).not.toBeInTheDocument();
    const slotSwitcher = screen.getByTestId("mock-slot-switcher");
    expect(slotSwitcher).not.toHaveAttribute("hidden");
  });

  it("exits edit mode when approve button is clicked", () => {
    const onEditModeChange = vi.fn();
    const props = createProps();
    render(
      <UploaderPreviewToolsPanel
        {...props}
        onEditModeChange={onEditModeChange}
      />,
    );

    const effectsButton = screen.getByRole("button", {
      name: t("uploader.previewEffectsButton"),
    });
    fireEvent.click(effectsButton);
    expect(onEditModeChange).toHaveBeenCalledWith(true);

    const approveButton = screen.getByRole("button", {
      name: t("uploader.effectsApprove"),
    });
    fireEvent.click(approveButton);
    expect(onEditModeChange).toHaveBeenCalledWith(false);

    expect(
      screen.queryByRole("button", { name: t("uploader.effectsApprove") }),
    ).not.toBeInTheDocument();
  });

  it("restores effects snapshot on cancel", () => {
    const onUpdateEffect = vi.fn();
    const onToggleRemoveBackground = vi.fn();
    const onToggleEnhance = vi.fn();
    const props = createProps();
    render(
      <UploaderPreviewToolsPanel
        {...props}
        onUpdateEffect={onUpdateEffect}
        onToggleRemoveBackground={onToggleRemoveBackground}
        onToggleEnhance={onToggleEnhance}
        activeImageEffects={{ brightness: 30, contrast: -10, removeBackground: true, enhance: false }}
      />,
    );

    const effectsButton = screen.getByRole("button", {
      name: t("uploader.previewEffectsButton"),
    });
    fireEvent.click(effectsButton);

    const cancelButton = screen.getByRole("button", {
      name: t("uploader.effectsCancel"),
    });
    fireEvent.click(cancelButton);

    expect(onUpdateEffect).toHaveBeenCalledWith("brightness", 30);
    expect(onUpdateEffect).toHaveBeenCalledWith("contrast", -10);
    expect(onToggleRemoveBackground).toHaveBeenCalledWith(true);
    expect(onToggleEnhance).toHaveBeenCalledWith(false);
  });

  it("restores effects snapshot on reset but keeps drawer open", () => {
    const onUpdateEffect = vi.fn();
    const props = createProps();
    render(
      <UploaderPreviewToolsPanel
        {...props}
        onUpdateEffect={onUpdateEffect}
        activeImageEffects={{ brightness: 50, contrast: 0 }}
      />,
    );

    const effectsButton = screen.getByRole("button", {
      name: t("uploader.previewEffectsButton"),
    });
    fireEvent.click(effectsButton);

    const resetButton = screen.getByRole("button", {
      name: t("uploader.effectsReset"),
    });
    fireEvent.click(resetButton);

    expect(onUpdateEffect).toHaveBeenCalledWith("brightness", 50);
    expect(onUpdateEffect).toHaveBeenCalledWith("contrast", 0);
    expect(
      screen.getByRole("button", { name: t("uploader.effectsCancel") }),
    ).toBeInTheDocument();
  });

  it("does not restore effects snapshot on approve", () => {
    const onUpdateEffect = vi.fn();
    const props = createProps();
    render(
      <UploaderPreviewToolsPanel
        {...props}
        onUpdateEffect={onUpdateEffect}
        activeImageEffects={{ brightness: 50, contrast: 0 }}
      />,
    );

    const effectsButton = screen.getByRole("button", {
      name: t("uploader.previewEffectsButton"),
    });
    fireEvent.click(effectsButton);

    const approveButton = screen.getByRole("button", {
      name: t("uploader.effectsApprove"),
    });
    fireEvent.click(approveButton);

    expect(onUpdateEffect).not.toHaveBeenCalledWith("brightness", expect.anything());
  });

  it("calls onEditModeChange when entering and exiting edit mode", () => {
    const onEditModeChange = vi.fn();
    const props = createProps();
    render(
      <UploaderPreviewToolsPanel {...props} onEditModeChange={onEditModeChange} />,
    );

    const effectsButton = screen.getByRole("button", {
      name: t("uploader.previewEffectsButton"),
    });
    fireEvent.click(effectsButton);
    expect(onEditModeChange).toHaveBeenCalledWith(true);

    const cancelButton = screen.getByRole("button", {
      name: t("uploader.effectsCancel"),
    });
    fireEvent.click(cancelButton);
    expect(onEditModeChange).toHaveBeenCalledWith(false);
  });

  it("shows zoom controls in edit mode when isZoomAvailable is true", () => {
    const props = createProps();
    render(
      <UploaderPreviewToolsPanel
        {...props}
        isZoomAvailable={true}
        onUpdateCropAdjust={vi.fn()}
      />,
    );

    const effectsButton = screen.getByRole("button", {
      name: t("uploader.previewEffectsButton"),
    });
    fireEvent.click(effectsButton);

    expect(screen.getByText(t("uploader.zoom"))).toBeInTheDocument();
  });

  it("hides zoom controls in edit mode when isZoomAvailable is false", () => {
    const props = createProps();
    render(
      <UploaderPreviewToolsPanel
        {...props}
        isZoomAvailable={false}
        onUpdateCropAdjust={vi.fn()}
      />,
    );

    const effectsButton = screen.getByRole("button", {
      name: t("uploader.previewEffectsButton"),
    });
    fireEvent.click(effectsButton);

    expect(screen.queryByText(t("uploader.zoom"))).not.toBeInTheDocument();
  });

  it("shows reset zoom button in edit mode when zoom is greater than 1", () => {
    const props = createProps();
    render(
      <UploaderPreviewToolsPanel
        {...props}
        isZoomAvailable={true}
        activeImageCropAdjust={{ zoom: 2, panX: 0, panY: 0 }}
        onUpdateCropAdjust={vi.fn()}
        onResetCropAdjust={vi.fn()}
      />,
    );

    const effectsButton = screen.getByRole("button", {
      name: t("uploader.previewEffectsButton"),
    });
    fireEvent.click(effectsButton);

    expect(screen.getByText(t("uploader.zoomReset"))).toBeInTheDocument();
  });

  it("calls onResetCropAdjust when reset zoom button is clicked", () => {
    const onResetCropAdjust = vi.fn();
    const props = createProps();
    render(
      <UploaderPreviewToolsPanel
        {...props}
        isZoomAvailable={true}
        activeImageCropAdjust={{ zoom: 2, panX: 0, panY: 0 }}
        onUpdateCropAdjust={vi.fn()}
        onResetCropAdjust={onResetCropAdjust}
      />,
    );

    const effectsButton = screen.getByRole("button", {
      name: t("uploader.previewEffectsButton"),
    });
    fireEvent.click(effectsButton);

    fireEvent.click(screen.getByText(t("uploader.zoomReset")));
    expect(onResetCropAdjust).toHaveBeenCalledOnce();
  });
});
