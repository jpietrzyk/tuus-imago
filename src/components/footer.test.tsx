import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { Footer } from "./footer";

describe("Footer Component", () => {
  it("should render the footer with copyright text", () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>,
    );

    expect(screen.getByText(/© \d{4} Tuus Imago/i)).toBeInTheDocument();
  });

  it("should render About Us link with correct href", () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>,
    );

    const aboutLink = screen.getByRole("link", { name: /o nas/i });
    expect(aboutLink).toBeInTheDocument();
    expect(aboutLink).toHaveAttribute("href", "/about");
  });

  it("should render Legal & Privacy link with correct href", () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>,
    );

    const legalLink = screen.getByRole("link", {
      name: /prawne i prywatność/i,
    });
    expect(legalLink).toBeInTheDocument();
    expect(legalLink).toHaveAttribute("href", "/legal");
  });

  it("should render Info icon in About Us link", () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>,
    );

    const aboutLink = screen.getByRole("link", { name: /o nas/i });
    const icon = aboutLink.querySelector("svg");
    expect(icon).toBeInTheDocument();
  });

  it("should render FileText icon in Legal & Privacy link", () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>,
    );

    const legalLink = screen.getByRole("link", {
      name: /prawne i prywatność/i,
    });
    const icon = legalLink.querySelector("svg");
    expect(icon).toBeInTheDocument();
  });

  it("should have correct styling classes", () => {
    const { container } = render(
      <MemoryRouter>
        <Footer />
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
