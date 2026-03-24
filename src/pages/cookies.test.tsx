import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { CookiesPage } from "./cookies";
import { tr } from "@/test/i18n-test";

describe("CookiesPage Component", () => {
  it("should render the cookies page title", () => {
    render(
      <MemoryRouter>
        <CookiesPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      tr("cookies.title"),
    );
  });

  it("should render the page subtitle", () => {
    render(
      <MemoryRouter>
        <CookiesPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(tr("cookies.subtitle"))).toBeInTheDocument();
  });

  it("should render the back to home link", () => {
    render(
      <MemoryRouter>
        <CookiesPage />
      </MemoryRouter>,
    );

    const backLink = screen.getByRole("link", {
      name: tr("common.backToHome"),
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
      screen.getByRole("heading", { name: tr("cookies.whatAreCookies.title") }),
    ).toBeInTheDocument();
  });

  it("should render the types of cookies section", () => {
    render(
      <MemoryRouter>
        <CookiesPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: tr("cookies.types.title") }),
    ).toBeInTheDocument();
  });

  it("should render the necessary cookies info", () => {
    render(
      <MemoryRouter>
        <CookiesPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByText(tr("cookies.types.necessary.title")),
    ).toBeInTheDocument();
  });

  it("should render the analytics cookies info", () => {
    render(
      <MemoryRouter>
        <CookiesPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByText(tr("cookies.types.analytics.title")),
    ).toBeInTheDocument();
  });

  it("should render the third party cookies section", () => {
    render(
      <MemoryRouter>
        <CookiesPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: tr("cookies.thirdParty.title") }),
    ).toBeInTheDocument();
  });

  it("should render the consent section", () => {
    render(
      <MemoryRouter>
        <CookiesPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: tr("cookies.consent.title") }),
    ).toBeInTheDocument();
  });

  it("should render the managing cookies section", () => {
    render(
      <MemoryRouter>
        <CookiesPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: tr("cookies.manage.title") }),
    ).toBeInTheDocument();
  });
});
