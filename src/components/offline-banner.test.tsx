import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { OfflineBanner } from "@/components/offline-banner";
import { t } from "@/locales/i18n";

describe("OfflineBanner", () => {
  it("renders nothing when online", () => {
    const { container } = render(<OfflineBanner />);
    expect(container.innerHTML).toBe("");
  });

  it("shows the offline message when the connection is lost", () => {
    render(<OfflineBanner />);
    fireEvent(window, new Event("offline"));

    expect(screen.getByText(t("offline.title"))).toBeInTheDocument();
    expect(screen.getByText(t("offline.message"))).toBeInTheDocument();
  });

  it("hides again when the connection is restored", () => {
    const { container } = render(<OfflineBanner />);
    fireEvent(window, new Event("offline"));
    expect(container.innerHTML).not.toBe("");

    fireEvent(window, new Event("online"));
    expect(container.innerHTML).toBe("");
  });

  it("is announced politely to assistive technology", () => {
    render(<OfflineBanner />);
    fireEvent(window, new Event("offline"));

    expect(screen.getByRole("status")).toHaveAttribute(
      "aria-live",
      "polite",
    );
  });
});
