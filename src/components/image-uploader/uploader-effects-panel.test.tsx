import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import {
  UploaderEffectsPanelButton,
  UploaderEffectsPanelContent,
} from "./uploader-effects-panel";
import { t } from "@/locales/i18n";

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

describe("UploaderEffectsPanelContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders brightness and contrast sliders", () => {
    render(
      <UploaderEffectsPanelContent
        onUpdateEffect={vi.fn()}
        onToggleRemoveBackground={vi.fn()}
        onToggleEnhance={vi.fn()}
        effects={{ brightness: 0, contrast: 0 }}
        disabled={false}
      />,
    );

    expect(screen.getByText(t("uploader.brightness"))).toBeInTheDocument();
    expect(screen.getByText(t("uploader.contrast"))).toBeInTheDocument();
  });

  it("renders AI effect toggles", () => {
    render(
      <UploaderEffectsPanelContent
        onUpdateEffect={vi.fn()}
        onToggleRemoveBackground={vi.fn()}
        onToggleEnhance={vi.fn()}
        effects={{ brightness: 0, contrast: 0 }}
        disabled={false}
      />,
    );

    expect(
      screen.getByRole("switch", { name: t("upload.aiRemoveBackground") }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("switch", { name: t("upload.aiEnhance") }),
    ).toBeInTheDocument();
  });

  it("calls onToggleRemoveBackground when switch is clicked", () => {
    const onToggleRemoveBackground = vi.fn();
    render(
      <UploaderEffectsPanelContent
        onUpdateEffect={vi.fn()}
        onToggleRemoveBackground={onToggleRemoveBackground}
        onToggleEnhance={vi.fn()}
        effects={{ brightness: 0, contrast: 0, removeBackground: false }}
        disabled={false}
      />,
    );

    const removeBackgroundSwitch = screen.getByRole("switch", {
      name: t("upload.aiRemoveBackground"),
    });
    fireEvent.click(removeBackgroundSwitch);

    expect(onToggleRemoveBackground).toHaveBeenCalledWith(true);
  });

  it("shows applying effect indicator when busy", () => {
    render(
      <UploaderEffectsPanelContent
        onUpdateEffect={vi.fn()}
        onToggleRemoveBackground={vi.fn()}
        onToggleEnhance={vi.fn()}
        effects={{ brightness: 0, contrast: 0 }}
        disabled={false}
        isRemoveBackgroundBusy={true}
      />,
    );

    expect(
      screen.getByText(t("uploader.applyingEffect")),
    ).toBeInTheDocument();
  });

  it("does not render close button", () => {
    render(
      <UploaderEffectsPanelContent
        onUpdateEffect={vi.fn()}
        onToggleRemoveBackground={vi.fn()}
        onToggleEnhance={vi.fn()}
        effects={{ brightness: 0, contrast: 0 }}
        disabled={false}
      />,
    );

    expect(
      screen.queryByRole("button", { name: t("uploader.effectsClose") }),
    ).not.toBeInTheDocument();
  });

  it("does not render reset effects button", () => {
    render(
      <UploaderEffectsPanelContent
        onUpdateEffect={vi.fn()}
        onToggleRemoveBackground={vi.fn()}
        onToggleEnhance={vi.fn()}
        effects={{ brightness: 50, contrast: 0 }}
        disabled={false}
      />,
    );

    expect(
      screen.queryByRole("button", { name: t("uploader.effectsReset") }),
    ).not.toBeInTheDocument();
  });

  describe("zoom controls", () => {
    it("does not render zoom slider when isZoomAvailable is false", () => {
      render(
        <UploaderEffectsPanelContent
          onUpdateEffect={vi.fn()}
          onToggleRemoveBackground={vi.fn()}
          onToggleEnhance={vi.fn()}
          effects={{ brightness: 0, contrast: 0 }}
          disabled={false}
          isZoomAvailable={false}
        />,
      );

      expect(screen.queryByText(t("uploader.zoom"))).not.toBeInTheDocument();
    });

    it("renders zoom slider when isZoomAvailable is true and onZoomChange is provided", () => {
      render(
        <UploaderEffectsPanelContent
          onUpdateEffect={vi.fn()}
          onToggleRemoveBackground={vi.fn()}
          onToggleEnhance={vi.fn()}
          effects={{ brightness: 0, contrast: 0 }}
          disabled={false}
          isZoomAvailable={true}
          onZoomChange={vi.fn()}
        />,
      );

      expect(screen.getByText(t("uploader.zoom"))).toBeInTheDocument();
    });

    it("displays current zoom value", () => {
      render(
        <UploaderEffectsPanelContent
          onUpdateEffect={vi.fn()}
          onToggleRemoveBackground={vi.fn()}
          onToggleEnhance={vi.fn()}
          effects={{ brightness: 0, contrast: 0 }}
          disabled={false}
          zoom={2}
          isZoomAvailable={true}
          onZoomChange={vi.fn()}
        />,
      );

      expect(screen.getByText("2.0x")).toBeInTheDocument();
    });

    it("does not render zoom slider when onZoomChange is not provided", () => {
      render(
        <UploaderEffectsPanelContent
          onUpdateEffect={vi.fn()}
          onToggleRemoveBackground={vi.fn()}
          onToggleEnhance={vi.fn()}
          effects={{ brightness: 0, contrast: 0 }}
          disabled={false}
          isZoomAvailable={true}
        />,
      );

      expect(screen.queryByText(t("uploader.zoom"))).not.toBeInTheDocument();
    });

    it("calls onZoomChange when zoom slider value changes", () => {
      const onZoomChange = vi.fn();
      render(
        <UploaderEffectsPanelContent
          onUpdateEffect={vi.fn()}
          onToggleRemoveBackground={vi.fn()}
          onToggleEnhance={vi.fn()}
          effects={{ brightness: 0, contrast: 0 }}
          disabled={false}
          zoom={1.5}
          isZoomAvailable={true}
          onZoomChange={onZoomChange}
        />,
      );

      const zoomLabel = screen.getByText(t("uploader.zoom"));
      const sliderContainer = zoomLabel.closest(".space-y-2")!;
      const rangeInput = sliderContainer.querySelector(
        'input[type="range"]',
      ) as HTMLInputElement;
      expect(rangeInput).toBeInTheDocument();
      fireEvent.change(rangeInput, { target: { value: "2" } });
      expect(onZoomChange).toHaveBeenCalledWith(2);
    });

    it("renders reset zoom button when zoom is greater than 1", () => {
      render(
        <UploaderEffectsPanelContent
          onUpdateEffect={vi.fn()}
          onToggleRemoveBackground={vi.fn()}
          onToggleEnhance={vi.fn()}
          effects={{ brightness: 0, contrast: 0 }}
          disabled={false}
          zoom={2}
          isZoomAvailable={true}
          onZoomChange={vi.fn()}
          onResetZoom={vi.fn()}
        />,
      );

      expect(
        screen.getByText(t("uploader.zoomReset")),
      ).toBeInTheDocument();
    });

    it("does not render reset zoom button when zoom is 1", () => {
      render(
        <UploaderEffectsPanelContent
          onUpdateEffect={vi.fn()}
          onToggleRemoveBackground={vi.fn()}
          onToggleEnhance={vi.fn()}
          effects={{ brightness: 0, contrast: 0 }}
          disabled={false}
          zoom={1}
          isZoomAvailable={true}
          onZoomChange={vi.fn()}
          onResetZoom={vi.fn()}
        />,
      );

      expect(
        screen.queryByText(t("uploader.zoomReset")),
      ).not.toBeInTheDocument();
    });

    it("calls onResetZoom when reset button is clicked", () => {
      const onResetZoom = vi.fn();
      render(
        <UploaderEffectsPanelContent
          onUpdateEffect={vi.fn()}
          onToggleRemoveBackground={vi.fn()}
          onToggleEnhance={vi.fn()}
          effects={{ brightness: 0, contrast: 0 }}
          disabled={false}
          zoom={2}
          isZoomAvailable={true}
          onZoomChange={vi.fn()}
          onResetZoom={onResetZoom}
        />,
      );

      fireEvent.click(screen.getByText(t("uploader.zoomReset")));
      expect(onResetZoom).toHaveBeenCalledOnce();
    });
  });
});
