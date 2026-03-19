import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { Footer } from "./footer";
import { tr } from "@/test/i18n-test";

describe("Footer Component", () => {
  it("should render the footer with copyright text", () => {
    render(
      <MemoryRouter>
        <Footer onOpenLegalMenu={vi.fn()} />
      </MemoryRouter>,
    );

    expect(screen.getByText(/© \d{4} Tuus Imago/i)).toBeInTheDocument();
  });

  it("should render legal CTA button", () => {
    render(
      <MemoryRouter>
        <Footer onOpenLegalMenu={vi.fn()} />
      </MemoryRouter>,
    );

    const legalButton = screen.getByRole("button", {
      name: tr("common.legalMenu"),
    });
    expect(legalButton).toBeInTheDocument();
  });

  it("should call callback when legal CTA is clicked", async () => {
    const user = userEvent.setup();
    const onOpenLegalMenu = vi.fn();

    render(
      <MemoryRouter>
        <Footer onOpenLegalMenu={onOpenLegalMenu} />
      </MemoryRouter>,
    );

    await user.click(
      screen.getByRole("button", { name: tr("common.legalMenu") }),
    );

    expect(onOpenLegalMenu).toHaveBeenCalledTimes(1);
  });

  it("should not render legacy about link in footer", () => {
    render(
      <MemoryRouter>
        <Footer onOpenLegalMenu={vi.fn()} />
      </MemoryRouter>,
    );

    expect(
      screen.queryByRole("link", { name: tr("common.aboutUs") }),
    ).not.toBeInTheDocument();
  });

  it("should not render legacy legal route link in footer", () => {
    render(
      <MemoryRouter>
        <Footer onOpenLegalMenu={vi.fn()} />
      </MemoryRouter>,
    );

    expect(
      screen.queryByRole("link", {
        name: tr("common.legalAndPrivacy"),
      }),
    ).not.toBeInTheDocument();
  });

  it("should render scale icon in legal CTA button", () => {
    render(
      <MemoryRouter>
        <Footer onOpenLegalMenu={vi.fn()} />
      </MemoryRouter>,
    );

    const legalButton = screen.getByRole("button", {
      name: tr("common.legalMenu"),
    });
    const icon = legalButton.querySelector("svg");
    expect(icon).toBeInTheDocument();
  });

  it("should have correct styling classes", () => {
    const { container } = render(
      <MemoryRouter>
        <Footer onOpenLegalMenu={vi.fn()} />
      </MemoryRouter>,
    );

    const footer = container.querySelector("footer");
    expect(footer).toHaveClass(
      "bg-white/95",
      "backdrop-blur-sm",
      "border-t",
      "border-gray-200",
      "shadow-lg",
    );
  });
});
