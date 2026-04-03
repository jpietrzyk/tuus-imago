import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { ShippingPage } from "./shipping";
import { t } from "@/locales/i18n";

vi.mock("@/lib/content-loader", () => ({
  getPageBySlug: vi.fn((slug: string) =>
    slug === "shipping"
      ? {
          title: "Test Title",
          subtitle: "Test Subtitle",
          slug: "shipping",
          icon: "Truck",
          menuSection: "legal",
          menuOrder: 6,
          lastUpdated: "2025-03-01",
          body: "## Section One\n\n## Section Two",
        }
      : undefined,
  ),
  getAllPages: vi.fn(() => []),
  getPagesBySection: vi.fn(() => []),
}));

describe("ShippingPage Component", () => {
  it("should render the page heading", () => {
    render(
      <MemoryRouter>
        <ShippingPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
  });

  it("should render the back to home link", () => {
    render(
      <MemoryRouter>
        <ShippingPage />
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
        <ShippingPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Ostatnia aktualizacja:/)).toBeInTheDocument();
  });

  it("should render markdown content in prose container", () => {
    const { container } = render(
      <MemoryRouter>
        <ShippingPage />
      </MemoryRouter>,
    );

    expect(container.querySelector(".legal-markdown")).toBeInTheDocument();
  });
});
