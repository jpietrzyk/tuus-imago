/// <reference types="@testing-library/jest-dom" />

import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { App } from "./App";
import { tr } from "@/test/i18n-test";

describe("App Component Routing", () => {
  it.each([
    ["/consents", "consents.title"],
    ["/contact", "contact.title"],
    ["/cookies", "cookies.title"],
    ["/privacy", "privacy.title"],
    ["/returns", "returns.title"],
    ["/security", "security.title"],
    ["/shipping", "shipping.title"],
    ["/terms", "terms.title"],
  ])(
    "should render legal route %s without runtime errors",
    (route, titleKey) => {
      render(
        <MemoryRouter initialEntries={[route]}>
          <App />
        </MemoryRouter>,
      );

      expect(
        screen.getByRole("heading", { name: tr(titleKey) }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: tr("common.backToHome") }),
      ).toHaveAttribute("href", "/");
    },
  );

  it("should render landing page when route is /", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>,
    );

    // Check for main landing page elements
    expect(
      screen.getByRole("button", { name: tr("landing.cta.button") }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: tr("landing.hero.title") }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(tr("landing.hero.description")),
    ).toBeInTheDocument();
  });

  it("should render about page when route is /about", () => {
    render(
      <MemoryRouter initialEntries={["/about"]}>
        <App />
      </MemoryRouter>,
    );

    // Check for about page elements
    expect(
      screen.getByRole("heading", { name: tr("about.title") }),
    ).toBeInTheDocument();
  });

  it("should render legal page when route is /legal", () => {
    render(
      <MemoryRouter initialEntries={["/legal"]}>
        <App />
      </MemoryRouter>,
    );

    // Check for legal page elements
    expect(
      screen.getByRole("heading", { name: tr("legal.title") }),
    ).toBeInTheDocument();
  });

  it("should render footer on all routes", () => {
    const { rerender } = render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>,
    );

    // Footer should be on home page
    expect(
      screen.getByText(
        tr("common.copyright", { year: new Date().getFullYear() }),
      ),
    ).toBeInTheDocument();

    // Footer should also be on /about route
    rerender(
      <MemoryRouter initialEntries={["/about"]}>
        <App />
      </MemoryRouter>,
    );
    expect(
      screen.getByText(
        tr("common.copyright", { year: new Date().getFullYear() }),
      ),
    ).toBeInTheDocument();

    // Footer should also be on /legal route
    rerender(
      <MemoryRouter initialEntries={["/legal"]}>
        <App />
      </MemoryRouter>,
    );
    expect(
      screen.getByText(
        tr("common.copyright", { year: new Date().getFullYear() }),
      ),
    ).toBeInTheDocument();
  });

  it("should render header with logo link on all routes", () => {
    const { rerender } = render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>,
    );

    const homeLogoLink = screen.getByRole("link", {
      name: "Tuus Imago – home",
    });
    expect(homeLogoLink).toBeInTheDocument();
    expect(homeLogoLink).toHaveAttribute("href", "/");

    rerender(
      <MemoryRouter initialEntries={["/about"]}>
        <App />
      </MemoryRouter>,
    );
    expect(
      screen.getByRole("link", { name: "Tuus Imago – home" }),
    ).toHaveAttribute("href", "/");
  });

  it("should render footer links on all pages", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>,
    );

    const legalButtons = screen.getAllByRole("button", {
      name: tr("common.legalMenu"),
    });

    expect(legalButtons.length).toBeGreaterThanOrEqual(2);
  });

  it("should render payments action in header", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("button", { name: tr("common.paymentsP24") }),
    ).toBeInTheDocument();
  });

  it("should render upload page when route is /upload", () => {
    render(
      <MemoryRouter initialEntries={["/upload"]}>
        <App />
      </MemoryRouter>,
    );

    // Check for upload page elements
    const uploadIcon = document.querySelector(".lucide-upload");
    const cameraIcon = document.querySelector(".lucide-camera");
    expect(uploadIcon).toBeInTheDocument();
    expect(cameraIcon).toBeInTheDocument();
    expect(screen.getByText(tr("upload.fileSupport"))).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: tr("checkout.openCheckout") }),
    ).not.toBeInTheDocument();
  });

  it("should render upload button on landing page", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>,
    );

    // Upload button should be on landing page
    expect(
      screen.getByRole("button", { name: tr("landing.cta.button") }),
    ).toBeInTheDocument();
  });

  it("should not render upload button on about page", () => {
    render(
      <MemoryRouter initialEntries={["/about"]}>
        <App />
      </MemoryRouter>,
    );

    // Upload button should NOT be on about page
    expect(
      screen.queryByRole("button", { name: tr("landing.cta.button") }),
    ).not.toBeInTheDocument();
  });

  it("should not render upload button on legal page", () => {
    render(
      <MemoryRouter initialEntries={["/legal"]}>
        <App />
      </MemoryRouter>,
    );

    // Upload button should NOT be on legal page
    expect(
      screen.queryByRole("button", { name: tr("landing.cta.button") }),
    ).not.toBeInTheDocument();
  });

  it("should not render footer checkout CTA on non-upload routes", () => {
    render(
      <MemoryRouter initialEntries={["/about"]}>
        <App />
      </MemoryRouter>,
    );

    expect(
      screen.queryByRole("button", { name: tr("checkout.openCheckout") }),
    ).not.toBeInTheDocument();
  });

  it("should render home navigation link on about page", () => {
    render(
      <MemoryRouter initialEntries={["/about"]}>
        <App />
      </MemoryRouter>,
    );

    const backLink = screen.getByRole("link", {
      name: tr("common.backToHome"),
    });
    expect(backLink).toBeInTheDocument();
    expect(backLink).toHaveAttribute("href", "/");
  });

  it("should render home navigation link on legal page", () => {
    render(
      <MemoryRouter initialEntries={["/legal"]}>
        <App />
      </MemoryRouter>,
    );

    const backLink = screen.getByRole("link", {
      name: tr("common.backToHome"),
    });
    expect(backLink).toBeInTheDocument();
    expect(backLink).toHaveAttribute("href", "/");
  });

  it("should have correct layout structure", () => {
    const { container } = render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>,
    );

    // App should be wrapped in a div with h-screen and flex flex-col
    const appWrapper = container.firstChild as HTMLElement;
    expect(appWrapper).toHaveClass("h-screen", "flex", "flex-col");
  });
});
