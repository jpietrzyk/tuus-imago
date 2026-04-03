import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { LegalNavigationSheet } from "./legal-navigation-sheet";
import { tr } from "@/test/i18n-test";

function renderSheet(
  props: Partial<Parameters<typeof LegalNavigationSheet>[0]> = {},
) {
  const defaults = {
    open: true,
    onOpenChange: vi.fn(),
    activeSection: "legal" as const,
  };
  return render(
    <MemoryRouter>
      <LegalNavigationSheet {...defaults} {...props} />
    </MemoryRouter>,
  );
}

describe("LegalNavigationSheet", () => {
  it("renders title and subtitle when open", () => {
    renderSheet();

    expect(screen.getByText(tr("legalMenu.title"))).toBeInTheDocument();
    expect(screen.getByText(tr("legalMenu.subtitle"))).toBeInTheDocument();
  });

  it("does not render content when closed", () => {
    renderSheet({ open: false });

    expect(screen.queryByText(tr("legalMenu.title"))).not.toBeInTheDocument();
  });

  it("renders all legal section links", () => {
    renderSheet();

    expect(
      screen.getByRole("link", { name: "Informacje prawne" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Polityka prywatności" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Warunki korzystania" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Polityka ciasteczek" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Zgody" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Bezpieczeństwo" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Zwroty i reklamacje" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Informacje o dostawie" }),
    ).toBeInTheDocument();
  });

  it("renders all company section links", () => {
    renderSheet();

    expect(
      screen.getByRole("link", { name: "O nas" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Kontakt" }),
    ).toBeInTheDocument();
  });

  it("renders payment section with links", () => {
    renderSheet();

    expect(
      screen.getByRole("link", { name: "Płatności" }),
    ).toBeInTheDocument();
    expect(screen.getByText(tr("legalMenu.paymentIntro"))).toBeInTheDocument();
  });

  it("renders section navigation buttons", () => {
    renderSheet();

    expect(
      screen.getByRole("button", { name: tr("common.legalMenu") }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: tr("common.paymentsP24") }),
    ).toBeInTheDocument();
  });

  it("calls onOpenChange(false) when close button is clicked", () => {
    const onOpenChange = vi.fn();
    renderSheet({ onOpenChange });

    fireEvent.click(
      screen.getByRole("button", { name: tr("legalMenu.close") }),
    );

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("calls onOpenChange(false) when a legal link is clicked", () => {
    const onOpenChange = vi.fn();
    renderSheet({ onOpenChange });

    fireEvent.click(screen.getByRole("link", { name: "Polityka prywatności" }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("calls onOpenChange(false) when a company link is clicked", () => {
    const onOpenChange = vi.fn();
    renderSheet({ onOpenChange });

    fireEvent.click(screen.getByRole("link", { name: "O nas" }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("legal nav button has secondary variant when activeSection is legal", () => {
    renderSheet({ activeSection: "legal" });

    const legalButton = screen.getByRole("button", {
      name: tr("common.legalMenu"),
    });
    expect(legalButton.className).toMatch(/secondary/);
  });

  it("payments nav button has secondary variant when activeSection is payments", () => {
    renderSheet({ activeSection: "payments" });

    const paymentsButton = screen.getByRole("button", {
      name: tr("common.paymentsP24"),
    });
    expect(paymentsButton.className).toMatch(/secondary/);
  });

  it("renders the payment intro text", () => {
    renderSheet();

    expect(screen.getByText(tr("legalMenu.paymentIntro"))).toBeInTheDocument();
  });

  it("legal links point to correct routes", () => {
    renderSheet();

    expect(
      screen.getByRole("link", { name: "Polityka prywatności" }),
    ).toHaveAttribute("href", "/privacy");
    expect(
      screen.getByRole("link", { name: "Warunki korzystania" }),
    ).toHaveAttribute("href", "/terms");
    expect(
      screen.getByRole("link", { name: "Polityka ciasteczek" }),
    ).toHaveAttribute("href", "/cookies");
  });

  it("company links point to correct routes", () => {
    renderSheet();

    expect(
      screen.getByRole("link", { name: "O nas" }),
    ).toHaveAttribute("href", "/about");
    expect(
      screen.getByRole("link", { name: "Kontakt" }),
    ).toHaveAttribute("href", "/contact");
  });
});
