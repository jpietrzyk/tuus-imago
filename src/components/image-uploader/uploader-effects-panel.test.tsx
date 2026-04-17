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

  it("shows applying effect indicator in AI Effects group when busy", () => {
    renderContent({ isRemoveBackgroundBusy: true });

    const trigger = screen.getByText(t("uploader.aiEffectsGroupTitle"));
    fireEvent.click(trigger);

    expect(
      screen.getByText(t("uploader.applyingEffect")),
    ).toBeInTheDocument();
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
