import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { ReturnsPage } from "./returns";
import { t } from "@/locales/i18n";

describe("ReturnsPage Component", () => {
  it("should render the returns page title", () => {
    render(
      <MemoryRouter>
        <ReturnsPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Zwroty i reklamacje",
    );
  });

  it("should render the page subtitle", () => {
    render(
      <MemoryRouter>
        <ReturnsPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("Nasza polityka zwrotów i reklamacji")).toBeInTheDocument();
  });

  it("should render the back to home link", () => {
    render(
      <MemoryRouter>
        <ReturnsPage />
      </MemoryRouter>,
    );

    const backLink = screen.getByRole("link", {
      name: t("common.backToHome"),
    });
    expect(backLink).toBeInTheDocument();
    expect(backLink).toHaveAttribute("href", "/");
  });

  it("should render the right of withdrawal section", () => {
    render(
      <MemoryRouter>
        <ReturnsPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByText("Prawo odstąpienia od umowy"),
    ).toBeInTheDocument();
  });

  it("should render the 14 days period", () => {
    render(
      <MemoryRouter>
        <ReturnsPage />
      </MemoryRouter>,
    );

    const matches = screen.getAllByText(/14 dni/);
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it("should render the return costs section", () => {
    render(
      <MemoryRouter>
        <ReturnsPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByText("Koszty zwrotu"),
    ).toBeInTheDocument();
  });

  it("should render the refund section", () => {
    render(
      <MemoryRouter>
        <ReturnsPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByText("Zwrot pieniędzy"),
    ).toBeInTheDocument();
  });

  it("should render the contact section", () => {
    render(
      <MemoryRouter>
        <ReturnsPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByText("Kontakt"),
    ).toBeInTheDocument();
  });

  it("should render the contact email", () => {
    render(
      <MemoryRouter>
        <ReturnsPage />
      </MemoryRouter>,
    );

    const emailLinks = screen.getAllByRole("link", {
      name: /returns@tuusimago.com/i,
    });
    expect(emailLinks.length).toBeGreaterThanOrEqual(1);
    expect(emailLinks[0]).toHaveAttribute("href", "mailto:returns@tuusimago.com");
  });
});
