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
      screen.getByRole("link", { name: tr("common.legalAndPrivacy") }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: tr("common.privacy") }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: tr("common.terms") }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: tr("common.cookies") }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: tr("common.consents") }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: tr("common.security") }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: tr("common.returns") }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: tr("common.shipping") }),
    ).toBeInTheDocument();
  });

  it("renders all company section links", () => {
    renderSheet();

    expect(
      screen.getByRole("link", { name: tr("common.aboutUs") }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: tr("common.contact") }),
    ).toBeInTheDocument();
  });

  it("renders payment section with coming soon items", () => {
    renderSheet();

    expect(screen.getByText(tr("legalMenu.p24Terms"))).toBeInTheDocument();
    expect(screen.getByText(tr("legalMenu.p24Privacy"))).toBeInTheDocument();
    expect(screen.getAllByText(tr("legalMenu.comingSoon"))).toHaveLength(2);
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

    fireEvent.click(screen.getByRole("link", { name: tr("common.privacy") }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("calls onOpenChange(false) when a company link is clicked", () => {
    const onOpenChange = vi.fn();
    renderSheet({ onOpenChange });

    fireEvent.click(screen.getByRole("link", { name: tr("common.aboutUs") }));

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
      screen.getByRole("link", { name: tr("common.privacy") }),
    ).toHaveAttribute("href", "/privacy");
    expect(
      screen.getByRole("link", { name: tr("common.terms") }),
    ).toHaveAttribute("href", "/terms");
    expect(
      screen.getByRole("link", { name: tr("common.cookies") }),
    ).toHaveAttribute("href", "/cookies");
  });

  it("company links point to correct routes", () => {
    renderSheet();

    expect(
      screen.getByRole("link", { name: tr("common.aboutUs") }),
    ).toHaveAttribute("href", "/about");
    expect(
      screen.getByRole("link", { name: tr("common.contact") }),
    ).toHaveAttribute("href", "/contact");
  });
});
