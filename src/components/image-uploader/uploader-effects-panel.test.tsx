import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import {
  UploaderEffectsPanelButton,
  UploaderEffectsPanelContent,
} from "./uploader-effects-panel";
import { t } from "@/locales/i18n";

const defaultTransform = { rotation: 0, flipHorizontal: false, flipVertical: false };

describe("UploaderEffectsPanelButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders enabled cog button by default", () => {
    render(
      <UploaderEffectsPanelButton
        disabled={false}
        isEditMode={false}
        onEnterEditMode={vi.fn()}
      />,
    );

    const cogButton = screen.getByRole("button", {
      name: t("uploader.previewEffectsButton"),
    });
    expect(cogButton).toBeInTheDocument();
    expect(cogButton).not.toBeDisabled();
  });

  it("disables button when disabled prop is true", () => {
    render(
      <UploaderEffectsPanelButton
        disabled={true}
        isEditMode={false}
        onEnterEditMode={vi.fn()}
      />,
    );

    const cogButton = screen.getByRole("button", {
      name: t("uploader.previewEffectsButton"),
    });
    expect(cogButton).toBeDisabled();
  });

  it("renders button with settings icon", () => {
    render(
      <UploaderEffectsPanelButton
        disabled={false}
        isEditMode={false}
        onEnterEditMode={vi.fn()}
      />,
    );

    const settingsIcon = document.querySelector(".lucide-settings");
    expect(settingsIcon).toBeInTheDocument();
  });

  it("renders button with aria-label from translations", () => {
    render(
      <UploaderEffectsPanelButton
        disabled={false}
        isEditMode={false}
        onEnterEditMode={vi.fn()}
      />,
    );

    const cogButton = screen.getByRole("button", {
      name: t("uploader.previewEffectsButton"),
    });
    expect(cogButton).toHaveAttribute(
      "title",
      t("uploader.previewEffectsDescription"),
    );
  });

  it("has aria-pressed=false when not in edit mode", () => {
    render(
      <UploaderEffectsPanelButton
        disabled={false}
        isEditMode={false}
        onEnterEditMode={vi.fn()}
      />,
    );

    const cogButton = screen.getByRole("button", {
      name: t("uploader.previewEffectsButton"),
    });
    expect(cogButton).toHaveAttribute("aria-pressed", "false");
  });

  it("has aria-pressed=true when in edit mode", () => {
    render(
      <UploaderEffectsPanelButton
        disabled={false}
        isEditMode={true}
        onEnterEditMode={vi.fn()}
      />,
    );

    const cogButton = screen.getByRole("button", {
      name: t("uploader.previewEffectsButton"),
    });
    expect(cogButton).toHaveAttribute("aria-pressed", "true");
  });

  it("calls onEnterEditMode when button is clicked", () => {
    const onEnterEditMode = vi.fn();
    render(
      <UploaderEffectsPanelButton
        disabled={false}
        isEditMode={false}
        onEnterEditMode={onEnterEditMode}
      />,
    );

    const cogButton = screen.getByRole("button", {
      name: t("uploader.previewEffectsButton"),
    });
    fireEvent.click(cogButton);

    expect(onEnterEditMode).toHaveBeenCalledOnce();
  });

  it("applies active styling when in edit mode", () => {
    render(
      <UploaderEffectsPanelButton
        disabled={false}
        isEditMode={true}
        onEnterEditMode={vi.fn()}
      />,
    );

    const cogButton = screen.getByRole("button", {
      name: t("uploader.previewEffectsButton"),
    });
    expect(cogButton.className).toContain("bg-primary");
  });
});

function renderContent(overrides: Partial<Parameters<typeof UploaderEffectsPanelContent>[0]> = {}) {
  return render(
    <UploaderEffectsPanelContent
      onUpdateEffect={vi.fn()}
      onToggleRemoveBackground={vi.fn()}
      onToggleEnhance={vi.fn()}
      onToggleUpscale={vi.fn()}
      onToggleRestore={vi.fn()}
      onUpdateRotation={vi.fn()}
      onToggleFlipHorizontal={vi.fn()}
      onToggleFlipVertical={vi.fn()}
      effects={{ brightness: 0, contrast: 0, grayscale: 0 }}
      transform={defaultTransform}
      disabled={false}
      {...overrides}
    />,
  );
}

describe("UploaderEffectsPanelContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders collapsible group triggers for all sections", () => {
    renderContent();

    expect(screen.getByText(t("uploader.adjustGroupTitle"))).toBeInTheDocument();
    expect(screen.getByText(t("uploader.aiEffectsGroupTitle"))).toBeInTheDocument();
    expect(screen.getByText(t("uploader.transformGroupTitle"))).toBeInTheDocument();
  });

  it("shows brightness, contrast, and grayscale sliders after expanding Adjustments group", () => {
    renderContent();

    const trigger = screen.getByText(t("uploader.adjustGroupTitle"));
    fireEvent.click(trigger);

    expect(screen.getByText(t("uploader.brightness"))).toBeInTheDocument();
    expect(screen.getByText(t("uploader.contrast"))).toBeInTheDocument();
    expect(screen.getByText(t("uploader.grayscale"))).toBeInTheDocument();
  });

  it("does not render AI effect switches when AI Effects group is collapsed", () => {
    renderContent();

    expect(
      screen.queryByRole("switch", { name: t("upload.aiRemoveBackground") }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("switch", { name: t("upload.aiEnhance") }),
    ).not.toBeInTheDocument();
  });

  it("shows AI effect switches after expanding AI Effects group", () => {
    renderContent();

    const trigger = screen.getByText(t("uploader.aiEffectsGroupTitle"));
    fireEvent.click(trigger);

    expect(
      screen.getByRole("switch", { name: t("upload.aiRemoveBackground") }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("switch", { name: t("upload.aiEnhance") }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("switch", { name: t("upload.aiUpscale") }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("switch", { name: t("upload.aiRestore") }),
    ).toBeInTheDocument();
  });

  it("shows transform controls after expanding Transform group", () => {
    renderContent();

    const trigger = screen.getByText(t("uploader.transformGroupTitle"));
    fireEvent.click(trigger);

    expect(
      screen.getByRole("button", { name: t("uploader.rotateMinus90") }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: t("uploader.rotatePlus90") }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: t("uploader.flipHorizontal") }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: t("uploader.flipVertical") }),
    ).toBeInTheDocument();
  });

  it("does not render close button", () => {
    renderContent();

    expect(
      screen.queryByRole("button", { name: t("uploader.effectsClose") }),
    ).not.toBeInTheDocument();
  });

  it("does not render reset effects button", () => {
    renderContent({
      effects: { brightness: 50, contrast: 0, grayscale: 0 },
    });

    expect(
      screen.queryByRole("button", { name: t("uploader.effectsReset") }),
    ).not.toBeInTheDocument();
  });

  it("does not render zoom reset button", () => {
    renderContent({
      zoom: 2,
      isZoomAvailable: true,
      onZoomChange: vi.fn(),
      onResetZoom: vi.fn(),
    });

    expect(
      screen.queryByText(t("uploader.zoomReset")),
    ).not.toBeInTheDocument();
  });

  describe("collapsible default states", () => {
    it("has zoom (Crop) group open by default when zoom is available", () => {
      renderContent({ isZoomAvailable: true, onZoomChange: vi.fn() });

      expect(screen.getByText(t("uploader.zoom"))).toBeInTheDocument();
    });

    it("has Adjustments group collapsed by default", () => {
      renderContent();

      expect(
        screen.queryByText(t("uploader.brightness")),
      ).not.toBeInTheDocument();
    });

    it("has AI Effects group collapsed by default", () => {
      renderContent();

      expect(
        screen.queryByRole("switch", { name: t("upload.aiRemoveBackground") }),
      ).not.toBeInTheDocument();
    });

    it("has Transform group collapsed by default", () => {
      renderContent();

      expect(
        screen.queryByRole("button", { name: t("uploader.rotateMinus90") }),
      ).not.toBeInTheDocument();
    });

    it("does not render Crop group when zoom is unavailable", () => {
      renderContent();

      expect(
        screen.queryByText(t("uploader.cropGroupTitle")),
      ).not.toBeInTheDocument();
    });
  });

  describe("Adjustments group interactions", () => {
    it("calls onUpdateEffect with brightness when brightness slider changes", () => {
      const onUpdateEffect = vi.fn();
      renderContent({ onUpdateEffect });

      fireEvent.click(screen.getByText(t("uploader.adjustGroupTitle")));

      const brightnessLabel = screen.getByText(t("uploader.brightness"));
      const sliderContainer = brightnessLabel.closest(".space-y-2")!;
      const rangeInput = sliderContainer.querySelector(
        'input[type="range"]',
      ) as HTMLInputElement;
      fireEvent.change(rangeInput, { target: { value: "50" } });
      expect(onUpdateEffect).toHaveBeenCalledWith("brightness", 50);
    });

    it("calls onUpdateEffect with contrast when contrast slider changes", () => {
      const onUpdateEffect = vi.fn();
      renderContent({ onUpdateEffect });

      fireEvent.click(screen.getByText(t("uploader.adjustGroupTitle")));

      const contrastLabel = screen.getByText(t("uploader.contrast"));
      const sliderContainer = contrastLabel.closest(".space-y-2")!;
      const rangeInput = sliderContainer.querySelector(
        'input[type="range"]',
      ) as HTMLInputElement;
      fireEvent.change(rangeInput, { target: { value: "-30" } });
      expect(onUpdateEffect).toHaveBeenCalledWith("contrast", -30);
    });

    it("calls onUpdateEffect with grayscale when grayscale slider changes", () => {
      const onUpdateEffect = vi.fn();
      renderContent({ onUpdateEffect });

      fireEvent.click(screen.getByText(t("uploader.adjustGroupTitle")));

      const grayscaleLabel = screen.getByText(t("uploader.grayscale"));
      const sliderContainer = grayscaleLabel.closest(".space-y-2")!;
      const rangeInput = sliderContainer.querySelector(
        'input[type="range"]',
      ) as HTMLInputElement;
      fireEvent.change(rangeInput, { target: { value: "75" } });
      expect(onUpdateEffect).toHaveBeenCalledWith("grayscale", 75);
    });

    it("displays brightness value with plus sign when positive", () => {
      renderContent({
        effects: { brightness: 42, contrast: 0, grayscale: 0 },
      });

      fireEvent.click(screen.getByText(t("uploader.adjustGroupTitle")));

      expect(screen.getByText("+42")).toBeInTheDocument();
    });

    it("displays contrast value without plus sign when negative", () => {
      renderContent({
        effects: { brightness: 0, contrast: -20, grayscale: 0 },
      });

      fireEvent.click(screen.getByText(t("uploader.adjustGroupTitle")));

      expect(screen.getByText("-20")).toBeInTheDocument();
    });

    it("disables sliders when disabled prop is true", () => {
      renderContent({ disabled: true });

      fireEvent.click(screen.getByText(t("uploader.adjustGroupTitle")));

      const brightnessLabel = screen.getByText(t("uploader.brightness"));
      const sliderContainer = brightnessLabel.closest(".space-y-2")!;
      const rangeInput = sliderContainer.querySelector(
        'input[type="range"]',
      ) as HTMLInputElement;
      expect(rangeInput).toBeDisabled();
    });
  });

  describe("AI Effects group interactions", () => {
    it("calls onToggleRemoveBackground when switch is toggled", () => {
      const onToggleRemoveBackground = vi.fn();
      renderContent({ onToggleRemoveBackground });

      fireEvent.click(screen.getByText(t("uploader.aiEffectsGroupTitle")));

      const switchEl = screen.getByRole("switch", {
        name: t("upload.aiRemoveBackground"),
      });
      fireEvent.click(switchEl);
      expect(onToggleRemoveBackground).toHaveBeenCalledWith(true);
    });

    it("calls onToggleEnhance when switch is toggled", () => {
      const onToggleEnhance = vi.fn();
      renderContent({ onToggleEnhance });

      fireEvent.click(screen.getByText(t("uploader.aiEffectsGroupTitle")));

      const switchEl = screen.getByRole("switch", {
        name: t("upload.aiEnhance"),
      });
      fireEvent.click(switchEl);
      expect(onToggleEnhance).toHaveBeenCalledWith(true);
    });

    it("calls onToggleUpscale when switch is toggled", () => {
      const onToggleUpscale = vi.fn();
      renderContent({ onToggleUpscale });

      fireEvent.click(screen.getByText(t("uploader.aiEffectsGroupTitle")));

      const switchEl = screen.getByRole("switch", {
        name: t("upload.aiUpscale"),
      });
      fireEvent.click(switchEl);
      expect(onToggleUpscale).toHaveBeenCalledWith(true);
    });

    it("calls onToggleRestore when switch is toggled", () => {
      const onToggleRestore = vi.fn();
      renderContent({ onToggleRestore });

      fireEvent.click(screen.getByText(t("uploader.aiEffectsGroupTitle")));

      const switchEl = screen.getByRole("switch", {
        name: t("upload.aiRestore"),
      });
      fireEvent.click(switchEl);
      expect(onToggleRestore).toHaveBeenCalledWith(true);
    });

    it("disables removeBackground switch when isRemoveBackgroundBusy is true", () => {
      renderContent({ isRemoveBackgroundBusy: true });

      fireEvent.click(screen.getByText(t("uploader.aiEffectsGroupTitle")));

      const switchEl = screen.getByRole("switch", {
        name: t("upload.aiRemoveBackground"),
      });
      expect(switchEl).toBeDisabled();
    });

    it("disables enhance switch when isEnhanceBusy is true", () => {
      renderContent({ isEnhanceBusy: true });

      fireEvent.click(screen.getByText(t("uploader.aiEffectsGroupTitle")));

      const switchEl = screen.getByRole("switch", {
        name: t("upload.aiEnhance"),
      });
      expect(switchEl).toBeDisabled();
    });

    it("disables upscale switch when isUpscaleBusy is true", () => {
      renderContent({ isUpscaleBusy: true });

      fireEvent.click(screen.getByText(t("uploader.aiEffectsGroupTitle")));

      const switchEl = screen.getByRole("switch", {
        name: t("upload.aiUpscale"),
      });
      expect(switchEl).toBeDisabled();
    });

    it("disables restore switch when isRestoreBusy is true", () => {
      renderContent({ isRestoreBusy: true });

      fireEvent.click(screen.getByText(t("uploader.aiEffectsGroupTitle")));

      const switchEl = screen.getByRole("switch", {
        name: t("upload.aiRestore"),
      });
      expect(switchEl).toBeDisabled();
    });

    it("shows applying indicator when any AI effect is busy", () => {
      renderContent({ isEnhanceBusy: true });

      fireEvent.click(screen.getByText(t("uploader.aiEffectsGroupTitle")));

      expect(
        screen.getByText(t("uploader.applyingEffect")),
      ).toBeInTheDocument();
    });

    it("does not show applying indicator when no AI effect is busy", () => {
      renderContent();

      fireEvent.click(screen.getByText(t("uploader.aiEffectsGroupTitle")));

      expect(
        screen.queryByText(t("uploader.applyingEffect")),
      ).not.toBeInTheDocument();
    });

    it("renders AI effect descriptions", () => {
      renderContent();

      fireEvent.click(screen.getByText(t("uploader.aiEffectsGroupTitle")));

      expect(
        screen.getByText(t("uploader.removeBackgroundDescription")),
      ).toBeInTheDocument();
      expect(
        screen.getByText(t("uploader.enhanceDescription")),
      ).toBeInTheDocument();
      expect(
        screen.getByText(t("uploader.upscaleDescription")),
      ).toBeInTheDocument();
      expect(
        screen.getByText(t("uploader.restoreDescription")),
      ).toBeInTheDocument();
    });
  });

  describe("Transform group interactions", () => {
    it("calls onUpdateRotation with -90 when rotate left button is clicked", () => {
      const onUpdateRotation = vi.fn();
      renderContent({ onUpdateRotation });

      fireEvent.click(screen.getByText(t("uploader.transformGroupTitle")));

      fireEvent.click(
        screen.getByRole("button", { name: t("uploader.rotateMinus90") }),
      );
      expect(onUpdateRotation).toHaveBeenCalledWith(-90);
    });

    it("calls onUpdateRotation with +90 when rotate right button is clicked", () => {
      const onUpdateRotation = vi.fn();
      renderContent({ onUpdateRotation });

      fireEvent.click(screen.getByText(t("uploader.transformGroupTitle")));

      fireEvent.click(
        screen.getByRole("button", { name: t("uploader.rotatePlus90") }),
      );
      expect(onUpdateRotation).toHaveBeenCalledWith(90);
    });

    it("displays current rotation value", () => {
      renderContent({
        transform: { rotation: 180, flipHorizontal: false, flipVertical: false },
      });

      fireEvent.click(screen.getByText(t("uploader.transformGroupTitle")));

      expect(screen.getByText("180°")).toBeInTheDocument();
    });

    it("calls onToggleFlipHorizontal when flip horizontal button is clicked", () => {
      const onToggleFlipHorizontal = vi.fn();
      renderContent({ onToggleFlipHorizontal });

      fireEvent.click(screen.getByText(t("uploader.transformGroupTitle")));

      fireEvent.click(
        screen.getByRole("button", { name: t("uploader.flipHorizontal") }),
      );
      expect(onToggleFlipHorizontal).toHaveBeenCalledWith(true);
    });

    it("calls onToggleFlipVertical when flip vertical button is clicked", () => {
      const onToggleFlipVertical = vi.fn();
      renderContent({ onToggleFlipVertical });

      fireEvent.click(screen.getByText(t("uploader.transformGroupTitle")));

      fireEvent.click(
        screen.getByRole("button", { name: t("uploader.flipVertical") }),
      );
      expect(onToggleFlipVertical).toHaveBeenCalledWith(true);
    });

    it("shows active styling on flip horizontal button when enabled", () => {
      renderContent({
        transform: { rotation: 0, flipHorizontal: true, flipVertical: false },
      });

      fireEvent.click(screen.getByText(t("uploader.transformGroupTitle")));

      const flipHButton = screen.getByRole("button", {
        name: t("uploader.flipHorizontal"),
      });
      expect(flipHButton.className).toContain("bg-primary");
    });

    it("shows active styling on flip vertical button when enabled", () => {
      renderContent({
        transform: { rotation: 0, flipHorizontal: false, flipVertical: true },
      });

      fireEvent.click(screen.getByText(t("uploader.transformGroupTitle")));

      const flipVButton = screen.getByRole("button", {
        name: t("uploader.flipVertical"),
      });
      expect(flipVButton.className).toContain("bg-primary");
    });

    it("calls onUpdateRotation relative to current rotation value", () => {
      const onUpdateRotation = vi.fn();
      renderContent({
        onUpdateRotation,
        transform: { rotation: 90, flipHorizontal: false, flipVertical: false },
      });

      fireEvent.click(screen.getByText(t("uploader.transformGroupTitle")));

      fireEvent.click(
        screen.getByRole("button", { name: t("uploader.rotatePlus90") }),
      );
      expect(onUpdateRotation).toHaveBeenCalledWith(180);
    });

    it("disables rotation and flip buttons when disabled prop is true", () => {
      renderContent({ disabled: true });

      fireEvent.click(screen.getByText(t("uploader.transformGroupTitle")));

      expect(
        screen.getByRole("button", { name: t("uploader.rotateMinus90") }),
      ).toBeDisabled();
      expect(
        screen.getByRole("button", { name: t("uploader.rotatePlus90") }),
      ).toBeDisabled();
      expect(
        screen.getByRole("button", { name: t("uploader.flipHorizontal") }),
      ).toBeDisabled();
      expect(
        screen.getByRole("button", { name: t("uploader.flipVertical") }),
      ).toBeDisabled();
    });
  });

  describe("zoom controls", () => {
    it("does not render zoom slider when isZoomAvailable is false", () => {
      renderContent({ isZoomAvailable: false });

      expect(screen.queryByText(t("uploader.zoom"))).not.toBeInTheDocument();
    });

    it("renders zoom slider in Crop group when isZoomAvailable is true and onZoomChange is provided", () => {
      renderContent({ isZoomAvailable: true, onZoomChange: vi.fn() });

      expect(screen.getByText(t("uploader.zoom"))).toBeInTheDocument();
      expect(screen.getByText(t("uploader.cropGroupTitle"))).toBeInTheDocument();
    });

    it("displays current zoom value", () => {
      renderContent({ zoom: 2, isZoomAvailable: true, onZoomChange: vi.fn() });

      expect(screen.getByText("2.0x")).toBeInTheDocument();
    });

    it("does not render zoom slider when onZoomChange is not provided", () => {
      renderContent({ isZoomAvailable: true });

      expect(screen.queryByText(t("uploader.zoom"))).not.toBeInTheDocument();
    });

    it("calls onZoomChange when zoom slider value changes", () => {
      const onZoomChange = vi.fn();
      renderContent({ zoom: 1.5, isZoomAvailable: true, onZoomChange });

      const zoomLabel = screen.getByText(t("uploader.zoom"));
      const sliderContainer = zoomLabel.closest(".space-y-2")!;
      const rangeInput = sliderContainer.querySelector(
        'input[type="range"]',
      ) as HTMLInputElement;
      expect(rangeInput).toBeInTheDocument();
      fireEvent.change(rangeInput, { target: { value: "2" } });
      expect(onZoomChange).toHaveBeenCalledWith(2);
    });
  });
});
