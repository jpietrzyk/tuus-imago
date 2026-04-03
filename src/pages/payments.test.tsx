import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { PaymentsPage } from "./payments";
import { t } from "@/locales/i18n";

vi.mock("@/lib/content-loader", () => ({
  getPageBySlug: vi.fn((slug: string) =>
    slug === "payments"
      ? {
          title: "Test Title",
          subtitle: "Test Subtitle",
          slug: "payments",
          icon: "BadgeDollarSign",
          menuSection: "payments",
          menuOrder: 1,
          lastUpdated: "2025-03-01",
          body: "## Section One\n\n## Section Two",
        }
      : undefined,
  ),
  getAllPages: vi.fn(() => []),
  getPagesBySection: vi.fn(() => []),
}));

describe("PaymentsPage Component", () => {
  it("should render the page heading", () => {
    render(
      <MemoryRouter>
        <PaymentsPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
  });

  it("should render the back to home link", () => {
    render(
      <MemoryRouter>
        <PaymentsPage />
      </MemoryRouter>,
    );

    const backLink = screen.getByRole("link", {
      name: t("common.backToHome"),
    });
    expect(backLink).toBeInTheDocument();
    expect(backLink).toHaveAttribute("href", "/");
  });

  it("should render the last updated text", () => {
    render(
      <MemoryRouter>
        <PaymentsPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Ostatnia aktualizacja:/)).toBeInTheDocument();
  });

  it("should render markdown content in prose container", () => {
    const { container } = render(
      <MemoryRouter>
        <PaymentsPage />
      </MemoryRouter>,
    );

    expect(container.querySelector(".legal-markdown")).toBeInTheDocument();
  });
});
