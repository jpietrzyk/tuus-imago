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

  it("renders effects title and description", () => {
    render(
      <UploaderEffectsPanelContent
        onUpdateEffect={vi.fn()}
        onToggleRemoveBackground={vi.fn()}
        onToggleEnhance={vi.fn()}
        onResetEffects={vi.fn()}
        onClose={vi.fn()}
        effects={{ brightness: 0, contrast: 0 }}
        disabled={false}
      />,
    );

    expect(
      screen.getByText(t("uploader.previewEffectsTitle")),
    ).toBeInTheDocument();
    expect(
      screen.getByText(t("uploader.previewEffectsDescription")),
    ).toBeInTheDocument();
  });

  it("renders brightness and contrast sliders", () => {
    render(
      <UploaderEffectsPanelContent
        onUpdateEffect={vi.fn()}
        onToggleRemoveBackground={vi.fn()}
        onToggleEnhance={vi.fn()}
        onResetEffects={vi.fn()}
        onClose={vi.fn()}
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
        onResetEffects={vi.fn()}
        onClose={vi.fn()}
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
        onResetEffects={vi.fn()}
        onClose={vi.fn()}
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

  it("shows reset button when effects are active", () => {
    render(
      <UploaderEffectsPanelContent
        onUpdateEffect={vi.fn()}
        onToggleRemoveBackground={vi.fn()}
        onToggleEnhance={vi.fn()}
        onResetEffects={vi.fn()}
        onClose={vi.fn()}
        effects={{ brightness: 50, contrast: 0 }}
        disabled={false}
      />,
    );

    expect(
      screen.getByText(t("uploader.effectsReset")),
    ).toBeInTheDocument();
  });

  it("hides reset button when no effects are active", () => {
    render(
      <UploaderEffectsPanelContent
        onUpdateEffect={vi.fn()}
        onToggleRemoveBackground={vi.fn()}
        onToggleEnhance={vi.fn()}
        onResetEffects={vi.fn()}
        onClose={vi.fn()}
        effects={{ brightness: 0, contrast: 0 }}
        disabled={false}
      />,
    );

    expect(
      screen.queryByText(t("uploader.effectsReset")),
    ).not.toBeInTheDocument();
  });

  it("shows applying effect indicator when busy", () => {
    render(
      <UploaderEffectsPanelContent
        onUpdateEffect={vi.fn()}
        onToggleRemoveBackground={vi.fn()}
        onToggleEnhance={vi.fn()}
        onResetEffects={vi.fn()}
        onClose={vi.fn()}
        effects={{ brightness: 0, contrast: 0 }}
        disabled={false}
        isRemoveBackgroundBusy={true}
      />,
    );

    expect(
      screen.getByText(t("uploader.applyingEffect")),
    ).toBeInTheDocument();
  });

  it("renders close button", () => {
    render(
      <UploaderEffectsPanelContent
        onUpdateEffect={vi.fn()}
        onToggleRemoveBackground={vi.fn()}
        onToggleEnhance={vi.fn()}
        onResetEffects={vi.fn()}
        onClose={vi.fn()}
        effects={{ brightness: 0, contrast: 0 }}
        disabled={false}
      />,
    );

    expect(
      screen.getByRole("button", { name: t("uploader.effectsClose") }),
    ).toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", () => {
    const onClose = vi.fn();
    render(
      <UploaderEffectsPanelContent
        onUpdateEffect={vi.fn()}
        onToggleRemoveBackground={vi.fn()}
        onToggleEnhance={vi.fn()}
        onResetEffects={vi.fn()}
        onClose={onClose}
        effects={{ brightness: 0, contrast: 0 }}
        disabled={false}
      />,
    );

    const closeButton = screen.getByRole("button", {
      name: t("uploader.effectsClose"),
    });
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalledOnce();
  });
});
