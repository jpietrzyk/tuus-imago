import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  UploaderSwipeNavHint,
  type SwipeNavHintProps,
} from "./uploader-swipe-nav-hint";
import { t } from "@/locales/i18n";

const createProps = (
  overrides: Partial<SwipeNavHintProps> = {},
): SwipeNavHintProps => ({
  hasPrevious: true,
  hasNext: true,
  onPrevious: vi.fn(),
  onNext: vi.fn(),
  showHint: true,
  ...overrides,
});

describe("UploaderSwipeNavHint", () => {
  it("renders previous and next chevrons when navigation is possible", () => {
    render(<UploaderSwipeNavHint {...createProps()} />);

    expect(
      screen.getByTestId("uploader-swipe-nav-previous"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("uploader-swipe-nav-next")).toBeInTheDocument();
  });

  it("omits the chevron when there is no slot in that direction", () => {
    render(
      <UploaderSwipeNavHint {...createProps({ hasPrevious: false, hasNext: false })} />,
    );

    expect(
      screen.queryByTestId("uploader-swipe-nav-previous"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("uploader-swipe-nav-next"),
    ).not.toBeInTheDocument();
  });

  it("navigates through the chevron buttons", () => {
    const onPrevious = vi.fn();
    const onNext = vi.fn();
    render(
      <UploaderSwipeNavHint {...createProps({ onPrevious, onNext })} />,
    );

    fireEvent.click(screen.getByTestId("uploader-swipe-nav-previous"));
    expect(onPrevious).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTestId("uploader-swipe-nav-next"));
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it("labels the chevrons for assistive technology", () => {
    render(<UploaderSwipeNavHint {...createProps()} />);

    expect(screen.getByTestId("uploader-swipe-nav-previous")).toHaveAttribute(
      "aria-label",
      t("uploader.previousImage"),
    );
    expect(screen.getByTestId("uploader-swipe-nav-next")).toHaveAttribute(
      "aria-label",
      t("uploader.nextImage"),
    );
  });

  it("shows the swipe hint pill until the user has navigated", () => {
    const { rerender } = render(<UploaderSwipeNavHint {...createProps()} />);

    expect(screen.getByTestId("uploader-swipe-hint-pill")).toBeInTheDocument();
    expect(screen.getByTestId("uploader-swipe-hint-pill")).toHaveTextContent(
      t("uploader.swipeHint"),
    );

    rerender(
      <UploaderSwipeNavHint {...createProps({ showHint: false })} />,
    );
    expect(
      screen.queryByTestId("uploader-swipe-hint-pill"),
    ).not.toBeInTheDocument();
  });

  it("announces the swipe hint politely", () => {
    render(<UploaderSwipeNavHint {...createProps()} />);

    expect(screen.getByRole("status")).toHaveAttribute(
      "aria-live",
      "polite",
    );
  });
});
