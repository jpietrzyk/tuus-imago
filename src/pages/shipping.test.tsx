import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { ShippingPage } from "./shipping";
import { tr } from "@/test/i18n-test";

describe("ShippingPage Component", () => {
  it("should render the shipping page title", () => {
    render(
      <MemoryRouter>
        <ShippingPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      tr("shipping.title"),
    );
  });

  it("should render the page subtitle", () => {
    render(
      <MemoryRouter>
        <ShippingPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(tr("shipping.subtitle"))).toBeInTheDocument();
  });

  it("should render the back to home link", () => {
    render(
      <MemoryRouter>
        <ShippingPage />
      </MemoryRouter>,
    );

    const backLink = screen.getByRole("link", {
      name: tr("common.backToHome"),
    });
    expect(backLink).toBeInTheDocument();
    expect(backLink).toHaveAttribute("href", "/");
  });

  it("should render the main shipping section", () => {
    render(
      <MemoryRouter>
        <ShippingPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: tr("shipping.main.title") }),
    ).toBeInTheDocument();
  });

  it("should render the carriers section with InPost", () => {
    render(
      <MemoryRouter>
        <ShippingPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: tr("shipping.carriers.title") }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(tr("shipping.carriers.inpost")),
    ).toBeInTheDocument();
  });

  it("should render the costs section", () => {
    render(
      <MemoryRouter>
        <ShippingPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: tr("shipping.costs.title") }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(tr("shipping.costs.standardLabel")),
    ).toBeInTheDocument();
  });

  it("should render the delivery time section", () => {
    render(
      <MemoryRouter>
        <ShippingPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: tr("shipping.timeframe.title") }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(tr("shipping.timeframe.businessDays")),
    ).toBeInTheDocument();
  });

  it("should render the no international shipping notice", () => {
    render(
      <MemoryRouter>
        <ShippingPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByText(tr("shipping.noInternational")),
    ).toBeInTheDocument();
  });

  it("should render the failed delivery section", () => {
    render(
      <MemoryRouter>
        <ShippingPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", {
        name: tr("shipping.failedDelivery.title"),
      }),
    ).toBeInTheDocument();
  });
});
