import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { UploaderPreviewToolsPanel } from "./uploader-preview-tools-panel";
import { t } from "@/locales/i18n";

const createProps = () => ({
  onUpdateEffect: vi.fn(),
  onToggleRemoveBackground: vi.fn(),
  onToggleEnhance: vi.fn(),
  onToggleUpscale: vi.fn(),
  onToggleRestore: vi.fn(),
  onUpdateRotation: vi.fn(),
  onToggleFlipHorizontal: vi.fn(),
  onToggleFlipVertical: vi.fn(),
  activeImageEffects: { brightness: 0, contrast: 0, grayscale: 0 },
  activeImageTransform: { rotation: 0, flipHorizontal: false, flipVertical: false },
  canUpdateEffects: true,
  selectedProportion: "horizontal" as const,
});

describe("UploaderPreviewToolsPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not show effects drawer by default", () => {
    const props = createProps();
    render(<UploaderPreviewToolsPanel {...props} />);

    expect(
      screen.queryByRole("button", { name: t("uploader.effectsCancel") }),
    ).not.toBeInTheDocument();
  });

  it("shows effects drawer when externalEditMode is true", () => {
    const props = createProps();
    render(<UploaderPreviewToolsPanel {...props} externalEditMode={true} />);

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

  it("calls onEditModeChange(false) when cancel button is clicked", () => {
    const onEditModeChange = vi.fn();
    const props = createProps();
    render(
      <UploaderPreviewToolsPanel
        {...props}
        externalEditMode={true}
        onEditModeChange={onEditModeChange}
      />,
    );

    const cancelButton = screen.getByRole("button", {
      name: t("uploader.effectsCancel"),
    });
    fireEvent.click(cancelButton);
    expect(onEditModeChange).toHaveBeenCalledWith(false);
  });

  it("calls onEditModeChange(false) when approve button is clicked", () => {
    const onEditModeChange = vi.fn();
    const props = createProps();
    render(
      <UploaderPreviewToolsPanel
        {...props}
        externalEditMode={true}
        onEditModeChange={onEditModeChange}
      />,
    );

    const approveButton = screen.getByRole("button", {
      name: t("uploader.effectsApprove"),
    });
    fireEvent.click(approveButton);
    expect(onEditModeChange).toHaveBeenCalledWith(false);
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
        activeImageEffects={{ brightness: 30, contrast: -10, grayscale: 0, removeBackground: true, enhance: false }}
        externalEditMode={true}
      />,
    );

    const cancelButton = screen.getByRole("button", {
      name: t("uploader.effectsCancel"),
    });
    fireEvent.click(cancelButton);

    expect(onUpdateEffect).toHaveBeenCalledWith("brightness", 30);
    expect(onUpdateEffect).toHaveBeenCalledWith("contrast", -10);
    expect(onToggleRemoveBackground).toHaveBeenCalledWith(true);
    expect(onToggleEnhance).toHaveBeenCalledWith(false);
  });

  it("resets effects to neutral values on reset but keeps drawer open", () => {
    const onUpdateEffect = vi.fn();
    const props = createProps();
    render(
      <UploaderPreviewToolsPanel
        {...props}
        onUpdateEffect={onUpdateEffect}
        activeImageEffects={{ brightness: 50, contrast: -20, grayscale: 70 }}
        externalEditMode={true}
      />,
    );

    const resetButton = screen.getByRole("button", {
      name: t("uploader.effectsReset"),
    });
    fireEvent.click(resetButton);

    expect(onUpdateEffect).toHaveBeenCalledWith("brightness", 0);
    expect(onUpdateEffect).toHaveBeenCalledWith("contrast", 0);
    expect(onUpdateEffect).toHaveBeenCalledWith("grayscale", 0);
    expect(
      screen.getByRole("button", { name: t("uploader.effectsCancel") }),
    ).toBeInTheDocument();
  });

  it("resets transform and AI effects to neutral values on reset", () => {
    const onUpdateRotation = vi.fn();
    const onToggleFlipHorizontal = vi.fn();
    const onToggleRemoveBackground = vi.fn();
    const onUpdateCropAdjust = vi.fn();
    const props = createProps();
    render(
      <UploaderPreviewToolsPanel
        {...props}
        onUpdateRotation={onUpdateRotation}
        onToggleFlipHorizontal={onToggleFlipHorizontal}
        onToggleRemoveBackground={onToggleRemoveBackground}
        onUpdateCropAdjust={onUpdateCropAdjust}
        activeImageEffects={{ brightness: 0, contrast: 0, grayscale: 0, removeBackground: true }}
        activeImageTransform={{ rotation: 90, flipHorizontal: true, flipVertical: false }}
        activeImageCropAdjust={{ zoom: 2, panX: 10, panY: -5 }}
        externalEditMode={true}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: t("uploader.effectsReset") }),
    );

    expect(onUpdateRotation).toHaveBeenCalledWith(0);
    expect(onToggleFlipHorizontal).toHaveBeenCalledWith(false);
    expect(onToggleRemoveBackground).toHaveBeenCalledWith(false);
    expect(onUpdateCropAdjust).toHaveBeenCalledWith(undefined);
  });

  it("does not restore effects snapshot on approve", () => {
    const onUpdateEffect = vi.fn();
    const props = createProps();
    render(
      <UploaderPreviewToolsPanel
        {...props}
        onUpdateEffect={onUpdateEffect}
        activeImageEffects={{ brightness: 50, contrast: 0, grayscale: 0 }}
        externalEditMode={true}
      />,
    );

    const approveButton = screen.getByRole("button", {
      name: t("uploader.effectsApprove"),
    });
    fireEvent.click(approveButton);

    expect(onUpdateEffect).not.toHaveBeenCalledWith("brightness", expect.anything());
  });

  it("shows crop reset button without zoom slider in edit mode when crop is adjusted", () => {
    const props = createProps();
    render(
      <UploaderPreviewToolsPanel
        {...props}
        onUpdateCropAdjust={vi.fn()}
        activeImageCropAdjust={{ zoom: 2, panX: 0, panY: 0 }}
        externalEditMode={true}
      />,
    );

    expect(
      screen.getByRole("button", { name: t("uploader.cropReset") }),
    ).toBeInTheDocument();
    expect(screen.queryByText(t("uploader.zoom"))).not.toBeInTheDocument();
  });

  it("hides crop group in edit mode when crop is not adjusted", () => {
    const props = createProps();
    render(
      <UploaderPreviewToolsPanel
        {...props}
        onUpdateCropAdjust={vi.fn()}
        externalEditMode={true}
      />,
    );

    expect(
      screen.queryByText(t("uploader.cropGroupTitle")),
    ).not.toBeInTheDocument();
  });

  it("hides transform group content when hideTransformGroup is true", () => {
    const props = createProps();
    render(
      <UploaderPreviewToolsPanel
        {...props}
        externalEditMode={true}
        effectsMode="settings"
        hideTransformGroup={true}
      />,
    );

    expect(
      screen.getByText(t("uploader.adjustGroupTitle")),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(t("uploader.transformGroupTitle")),
    ).not.toBeInTheDocument();
  });

  it("shows AI Effects title when effectsMode is ai", () => {
    const props = createProps();
    render(
      <UploaderPreviewToolsPanel
        {...props}
        externalEditMode={true}
        effectsMode="ai"
      />,
    );

    expect(screen.getByTestId("effects-drawer-title")).toHaveTextContent(t("uploader.aiEffectsTitle"));
    expect(screen.queryByText(t("uploader.settingsEffectsTitle"))).not.toBeInTheDocument();
  });

  it("shows Settings title when effectsMode is settings", () => {
    const props = createProps();
    render(
      <UploaderPreviewToolsPanel
        {...props}
        externalEditMode={true}
        effectsMode="settings"
      />,
    );

    expect(screen.getByText(t("uploader.settingsEffectsTitle"))).toBeInTheDocument();
    expect(screen.queryByText(t("uploader.aiEffectsTitle"))).not.toBeInTheDocument();
  });

  it("shows only AI Effects group content when effectsMode is ai", () => {
    const props = createProps();
    render(
      <UploaderPreviewToolsPanel
        {...props}
        externalEditMode={true}
        effectsMode="ai"
      />,
    );

    expect(screen.getByText(t("uploader.aiEffectsGroupTitle"))).toBeInTheDocument();
    expect(screen.queryByText(t("uploader.adjustGroupTitle"))).not.toBeInTheDocument();
    expect(screen.queryByText(t("uploader.transformGroupTitle"))).not.toBeInTheDocument();
  });

  it("shows settings groups content when effectsMode is settings", () => {
    const props = createProps();
    render(
      <UploaderPreviewToolsPanel
        {...props}
        externalEditMode={true}
        effectsMode="settings"
      />,
    );

    expect(screen.getByText(t("uploader.adjustGroupTitle"))).toBeInTheDocument();
    expect(screen.getByText(t("uploader.transformGroupTitle"))).toBeInTheDocument();
    expect(screen.queryByText(t("uploader.aiEffectsGroupTitle"))).not.toBeInTheDocument();
  });
});
