import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { LandingPage } from "./landing";
import { tr } from "@/test/i18n-test";

describe("LandingPage Component", () => {
  it("should render the hero title", () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      tr("landing.hero.title"),
    );
  });

  it("should render the hero description", () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByText(tr("landing.hero.description")),
    ).toBeInTheDocument();
  });

  it("should render the upload button", () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>,
    );

    const uploadButtons = screen.getAllByRole("link", {
      name: tr("landing.cta.button"),
    });
    expect(uploadButtons.length).toBeGreaterThan(0);
    expect(uploadButtons[0]).toHaveAttribute("href", "/upload");
  });

  it("should render the upload button with correct text", () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>,
    );

    expect(screen.getAllByText(tr("landing.cta.button")).length).toBeGreaterThan(0);
  });
});
