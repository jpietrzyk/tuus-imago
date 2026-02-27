import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { StartPage } from "./start";
import { tr } from "@/test/i18n-test";

describe("StartPage Component", () => {
  it("should render the upload CTA button", () => {
    render(
      <MemoryRouter>
        <StartPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("button", { name: tr("landing.cta.button") }),
    ).toBeInTheDocument();
  });

  it("should render the upload icon", () => {
    render(
      <MemoryRouter>
        <StartPage />
      </MemoryRouter>,
    );

    expect(document.querySelector(".lucide-upload")).toBeInTheDocument();
  });

  it("should link CTA to /upload", () => {
    render(
      <MemoryRouter>
        <StartPage />
      </MemoryRouter>,
    );

    const ctaLink = screen.getByRole("link", {
      name: tr("landing.cta.button"),
    });
    expect(ctaLink).toBeInTheDocument();
    expect(ctaLink).toHaveAttribute("href", "/upload");
  });
});
