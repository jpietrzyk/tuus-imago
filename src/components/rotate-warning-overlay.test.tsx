import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { RotateWarningOverlay } from "@/components/rotate-warning-overlay";
import { t } from "@/locales/i18n";

type ChangeListener = (event: { matches: boolean }) => void;

function mockMatchMedia(initialMatches: boolean) {
  const listeners = new Set<ChangeListener>();
  let matches = initialMatches;

  window.matchMedia = ((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addListener: (listener: ChangeListener) => listeners.add(listener),
    removeListener: (listener: ChangeListener) => listeners.delete(listener),
    addEventListener: (_type: string, listener: ChangeListener) =>
      listeners.add(listener),
    removeEventListener: (_type: string, listener: ChangeListener) =>
      listeners.delete(listener),
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;

  return {
    setMatches(value: boolean) {
      matches = value;
      listeners.forEach((listener) => listener({ matches: value }));
    },
  };
}

describe("RotateWarningOverlay", () => {
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    mockMatchMedia(false);
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it("renders nothing when the phone is in portrait mode", () => {
    const { container } = render(<RotateWarningOverlay />);
    expect(container.innerHTML).toBe("");
  });

  it("shows the warning when the phone is held in landscape", () => {
    mockMatchMedia(true);
    render(<RotateWarningOverlay />);

    expect(screen.getByText(t("rotateWarning.title"))).toBeInTheDocument();
    expect(screen.getByText(t("rotateWarning.message"))).toBeInTheDocument();
  });

  it("appears when the phone is rotated to landscape and hides when rotated back", () => {
    const media = mockMatchMedia(false);
    const { container } = render(<RotateWarningOverlay />);
    expect(container.innerHTML).toBe("");

    act(() => {
      media.setMatches(true);
    });
    expect(screen.getByText(t("rotateWarning.title"))).toBeInTheDocument();

    act(() => {
      media.setMatches(false);
    });
    expect(container.innerHTML).toBe("");
  });

  it("is announced politely to assistive technology", () => {
    mockMatchMedia(true);
    render(<RotateWarningOverlay />);

    expect(screen.getByRole("status")).toHaveAttribute(
      "aria-live",
      "polite",
    );
  });
});
