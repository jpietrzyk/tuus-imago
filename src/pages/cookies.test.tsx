import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { CookiesPage } from "./cookies";
import { t } from "@/locales/i18n";

describe("CookiesPage Component", () => {
  it("should render the cookies page title", () => {
    render(
      <MemoryRouter>
        <CookiesPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Polityka ciasteczek",
    );
  });

  it("should render the page subtitle", () => {
    render(
      <MemoryRouter>
        <CookiesPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("Jak używamy ciasteczek na naszej stronie")).toBeInTheDocument();
  });

  it("should render the back to home link", () => {
    render(
      <MemoryRouter>
        <CookiesPage />
      </MemoryRouter>,
    );

    const backLink = screen.getByRole("link", {
      name: t("common.backToHome"),
    });
    expect(backLink).toBeInTheDocument();
    expect(backLink).toHaveAttribute("href", "/");
  });

  it("should render the what are cookies section", () => {
    render(
      <MemoryRouter>
        <CookiesPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: "Czym są ciasteczka" }),
    ).toBeInTheDocument();
  });

  it("should render the types of cookies section", () => {
    render(
      <MemoryRouter>
        <CookiesPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: "Rodzaje ciasteczek, których używamy" }),
    ).toBeInTheDocument();
  });

  it("should render the necessary cookies info", () => {
    render(
      <MemoryRouter>
        <CookiesPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: "Niezbędne ciasteczka" }),
    ).toBeInTheDocument();
  });

  it("should render the analytics cookies info", () => {
    render(
      <MemoryRouter>
        <CookiesPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: "Ciasteczka analityczne" }),
    ).toBeInTheDocument();
  });

  it("should render the third party cookies section", () => {
    render(
      <MemoryRouter>
        <CookiesPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: "Ciasteczka osób trzecich" }),
    ).toBeInTheDocument();
  });

  it("should render the consent section", () => {
    render(
      <MemoryRouter>
        <CookiesPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: "Zgoda na ciasteczka" }),
    ).toBeInTheDocument();
  });

  it("should render the managing cookies section", () => {
    render(
      <MemoryRouter>
        <CookiesPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: "Zarządzanie ciasteczkami" }),
    ).toBeInTheDocument();
  });
});
