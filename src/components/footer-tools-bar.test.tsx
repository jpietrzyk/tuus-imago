import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { FooterToolsBar, type FooterToolsBarProps } from "./footer-tools-bar";
import { t } from "@/locales/i18n";

vi.mock("@/components/image-uploader/uploader-tools", () => ({
  UploaderTools: ({
    onSelectProportion,
    triggerButton,
  }: {
    onSelectProportion: (p: string) => void;
    triggerButton?: React.ReactNode;
    coveragePercent?: unknown;
    selectedProportion?: string;
    showCoverageDetails?: boolean;
  }) => (
    <div data-testid="mock-uploader-tools">
      {triggerButton}
      <button onClick={() => onSelectProportion("horizontal")}>
        Proportion
      </button>
    </div>
  ),
}));

vi.mock("@/components/image-uploader/size-selector", () => ({
  SizeSelector: () => <div data-testid="mock-size-selector" />,
}));

vi.mock("@/components/icons/icon-shape.svg?react", () => ({
  default: () => <svg data-testid="icon-shape" />,
}));
vi.mock("@/components/icons/icon-frame.svg?react", () => ({
  default: () => <svg data-testid="icon-frame" />,
}));
vi.mock("@/components/icons/icon-ai-editor.svg?react", () => ({
  default: () => <svg data-testid="icon-ai-editor" />,
}));
vi.mock("@/components/icons/icon-settings.svg?react", () => ({
  default: () => <svg data-testid="icon-settings" />,
}));
vi.mock("@/components/icons/icon-triptych.svg?react", () => ({
  default: () => <svg data-testid="icon-triptych" />,
}));
vi.mock("@/components/icons/icon-reset.svg?react", () => ({
  default: () => <svg data-testid="icon-reset" />,
}));

const createProps = (): FooterToolsBarProps => ({
  onSplitImage: vi.fn(),
  canSplitImage: true,
  shouldConfirmSplit: false,
  splitConfirmVariant: "none",
  onSelectProportion: vi.fn(),
  selectedProportion: "horizontal",
  isZoomPanMode: false,
  onToggleZoomPan: vi.fn(),
  canToggleZoomPan: false,
  onEnterAiEditMode: vi.fn(),
  canUpdateAiEffects: false,
  canUpdateEffects: true,
  isEditMode: false,
  onEnterEditMode: vi.fn(),
  onReset: vi.fn(),
  canReset: true,
  selectedPaintingSize: 2,
  onSelectPaintingSize: vi.fn(),
  paintingShape: "square" as const,
});

describe("FooterToolsBar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders size selector and all 6 toolbar buttons", () => {
    const props = createProps();
    render(<FooterToolsBar {...props} />);

    expect(screen.getByTestId("mock-size-selector")).toBeInTheDocument();
    expect(screen.getByTestId("mock-uploader-tools")).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: t("uploader.shapeButton") }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: t("uploader.frameButton") }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: t("uploader.aiEditorButton") }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: t("uploader.settingsButton") }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: t("uploader.splitSelectedImage") }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: t("uploader.resetSlots") }),
    ).toBeInTheDocument();
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

  it("enables settings button when canUpdateEffects is true", () => {
    const props = createProps();
    render(<FooterToolsBar {...props} />);

    const settingsButton = screen.getByRole("button", {
      name: t("uploader.settingsButton"),
    });
    expect(settingsButton).not.toBeDisabled();
  });

  it("disables settings button when canUpdateEffects is false", () => {
    const props = createProps();
    render(<FooterToolsBar {...props} canUpdateEffects={false} />);

    const settingsButton = screen.getByRole("button", {
      name: t("uploader.settingsButton"),
    });
    expect(settingsButton).toBeDisabled();
  });

  it("calls onEnterEditMode when settings button is clicked", () => {
    const onEnterEditMode = vi.fn();
    const props = createProps();
    render(<FooterToolsBar {...props} onEnterEditMode={onEnterEditMode} />);

    const settingsButton = screen.getByRole("button", {
      name: t("uploader.settingsButton"),
    });
    fireEvent.click(settingsButton);

    expect(onEnterEditMode).toHaveBeenCalled();
  });

  it("enables AI editor button when canUpdateAiEffects is true", () => {
    const props = createProps();
    render(<FooterToolsBar {...props} canUpdateAiEffects={true} />);

    const aiButton = screen.getByRole("button", {
      name: t("uploader.aiEditorButton"),
    });
    expect(aiButton).not.toBeDisabled();
  });

  it("disables AI editor button when canUpdateAiEffects is false", () => {
    const props = createProps();
    render(<FooterToolsBar {...props} canUpdateAiEffects={false} />);

    const aiButton = screen.getByRole("button", {
      name: t("uploader.aiEditorButton"),
    });
    expect(aiButton).toBeDisabled();
  });

  it("calls onEnterAiEditMode when AI editor button is clicked", () => {
    const onEnterAiEditMode = vi.fn();
    const props = createProps();
    render(<FooterToolsBar {...props} canUpdateAiEffects={true} onEnterAiEditMode={onEnterAiEditMode} />);

    const aiButton = screen.getByRole("button", {
      name: t("uploader.aiEditorButton"),
    });
    fireEvent.click(aiButton);

    expect(onEnterAiEditMode).toHaveBeenCalled();
  });

  it("enables frame button when canToggleZoomPan is true", () => {
    const props = createProps();
    render(<FooterToolsBar {...props} canToggleZoomPan={true} />);

    const frameButton = screen.getByRole("button", {
      name: t("uploader.frameButton"),
    });
    expect(frameButton).not.toBeDisabled();
  });

  it("disables frame button when canToggleZoomPan is false", () => {
    const props = createProps();
    render(<FooterToolsBar {...props} canToggleZoomPan={false} />);

    const frameButton = screen.getByRole("button", {
      name: t("uploader.frameButton"),
    });
    expect(frameButton).toBeDisabled();
  });

  it("calls onToggleZoomPan when frame button is clicked", () => {
    const onToggleZoomPan = vi.fn();
    const props = createProps();
    render(<FooterToolsBar {...props} canToggleZoomPan={true} onToggleZoomPan={onToggleZoomPan} />);

    const frameButton = screen.getByRole("button", {
      name: t("uploader.frameButton"),
    });
    fireEvent.click(frameButton);

    expect(onToggleZoomPan).toHaveBeenCalled();
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

  it("shows split confirmation dialog when shouldConfirmSplit is true", () => {
    const props = createProps();
    render(
      <FooterToolsBar
        {...props}
        shouldConfirmSplit={true}
        splitConfirmVariant="overwrite"
      />,
    );

    const splitButton = screen.getByRole("button", {
      name: t("uploader.splitSelectedImage"),
    });
    fireEvent.click(splitButton);

    expect(
      screen.getByText(t("uploader.splitSlotsConfirmTitle")),
    ).toBeInTheDocument();
  });

  it("shows printability description for printability variant", () => {
    const props = createProps();
    render(
      <FooterToolsBar
        {...props}
        shouldConfirmSplit={true}
        splitConfirmVariant="printability"
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: t("uploader.splitSelectedImage") }),
    );

    expect(
      screen.getByText(t("uploader.splitPrintabilityConfirmDescription")),
    ).toBeInTheDocument();
  });

  it("shows combined description for both variant", () => {
    const props = createProps();
    render(
      <FooterToolsBar
        {...props}
        shouldConfirmSplit={true}
        splitConfirmVariant="both"
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: t("uploader.splitSelectedImage") }),
    );

    expect(
      screen.getByText(t("uploader.splitBothConfirmDescription")),
    ).toBeInTheDocument();
  });

  it("shows unavailable tooltip when split disabled due to no printable size", () => {
    const props = createProps();
    render(
      <FooterToolsBar
        {...props}
        canSplitImage={false}
        triptychDisabledReason="noPrintableSize"
      />,
    );

    const splitButton = screen.getByRole("button", {
      name: t("uploader.splitSelectedImage"),
    });
    expect(splitButton).toBeDisabled();
    expect(splitButton).toHaveAttribute(
      "title",
      t("uploader.triptychUnavailableNoSize"),
    );
  });

  it("disables kadr button when canToggleZoomPan is false", () => {
    const props = createProps();
    render(<FooterToolsBar {...props} canToggleZoomPan={false} />);

    const frameButton = screen.getByRole("button", {
      name: t("uploader.frameButton"),
    });
    expect(frameButton).toBeDisabled();
  });

  it("disables AI editor button when canUpdateAiEffects is false", () => {
    const props = createProps();
    render(<FooterToolsBar {...props} canUpdateAiEffects={false} />);

    const aiButton = screen.getByRole("button", {
      name: t("uploader.aiEditorButton"),
    });
    expect(aiButton).toBeDisabled();
  });

  it("disables reset button when canReset is false", () => {
    const props = createProps();
    render(<FooterToolsBar {...props} canReset={false} />);

    const resetButton = screen.getByRole("button", {
      name: t("uploader.resetSlots"),
    });
    expect(resetButton).toBeDisabled();
  });

  it("shows reset confirmation dialog when reset button is clicked", () => {
    const props = createProps();
    render(<FooterToolsBar {...props} />);

    const resetButton = screen.getByRole("button", {
      name: t("uploader.resetSlots"),
    });
    fireEvent.click(resetButton);

    expect(
      screen.getByText(t("uploader.resetSlotsConfirmTitle")),
    ).toBeInTheDocument();
  });

  it("calls onReset when reset confirmation action is clicked", () => {
    const onReset = vi.fn();
    const props = createProps();
    render(<FooterToolsBar {...props} onReset={onReset} />);

    const resetButton = screen.getByRole("button", {
      name: t("uploader.resetSlots"),
    });
    fireEvent.click(resetButton);

    const confirmButton = screen.getByRole("button", {
      name: t("uploader.resetSlotsConfirmAction"),
    });
    fireEvent.click(confirmButton);

    expect(onReset).toHaveBeenCalled();
  });

  it("does not render triptych link toggle when canToggleTriptychLink is false", () => {
    const props = createProps();
    render(<FooterToolsBar {...props} />);

    expect(screen.queryByTestId("triptych-link-toggle")).toBeNull();
  });

  it("replaces the triptych split button with the link toggle in triptych mode", () => {
    const onSplitImage = vi.fn();
    const props = createProps();
    render(
      <FooterToolsBar
        {...props}
        onSplitImage={onSplitImage}
        canToggleTriptychLink={true}
        isTriptychLinked={true}
      />,
    );

    expect(screen.getByTestId("triptych-link-toggle")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: t("uploader.splitSelectedImage"),
      }),
    ).toBeNull();
    expect(onSplitImage).not.toHaveBeenCalled();
  });

  it("renders triptych link toggle when canToggleTriptychLink is true", () => {
    const props = createProps();
    render(
      <FooterToolsBar
        {...props}
        canToggleTriptychLink={true}
        isTriptychLinked={true}
      />,
    );

    const linkToggle = screen.getByTestId("triptych-link-toggle");
    expect(linkToggle).toBeInTheDocument();
    expect(linkToggle).toHaveAttribute("data-linked", "true");
    expect(linkToggle).toHaveAttribute(
      "aria-label",
      t("uploader.triptychLinkedTooltip"),
    );
  });

  it("reflects unlinked state on the triptych link toggle", () => {
    const props = createProps();
    render(
      <FooterToolsBar
        {...props}
        canToggleTriptychLink={true}
        isTriptychLinked={false}
      />,
    );

    const linkToggle = screen.getByTestId("triptych-link-toggle");
    expect(linkToggle).toHaveAttribute("data-linked", "false");
    expect(linkToggle).toHaveAttribute(
      "aria-label",
      t("uploader.triptychUnlinkedTooltip"),
    );
  });

  it("calls onToggleTriptychLink when the link toggle is clicked", () => {
    const onToggleTriptychLink = vi.fn();
    const props = createProps();
    render(
      <FooterToolsBar
        {...props}
        canToggleTriptychLink={true}
        onToggleTriptychLink={onToggleTriptychLink}
      />,
    );

    fireEvent.click(screen.getByTestId("triptych-link-toggle"));

    expect(onToggleTriptychLink).toHaveBeenCalledOnce();
  });
});
