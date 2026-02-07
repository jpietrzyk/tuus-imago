import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { AboutPage } from "./about";

describe("AboutPage Component", () => {
  it("should render the About Us page title", () => {
    render(
      <MemoryRouter>
        <AboutPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "About Us",
    );
  });

  it("should render the page description", () => {
    render(
      <MemoryRouter>
        <AboutPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByText(/Learn more about Tuus Imago and our mission/i),
    ).toBeInTheDocument();
  });

  it("should render the Back to Home link", () => {
    render(
      <MemoryRouter>
        <AboutPage />
      </MemoryRouter>,
    );

    const backLink = screen.getByRole("link", { name: /back to home/i });
    expect(backLink).toBeInTheDocument();
    expect(backLink).toHaveAttribute("href", "/");
  });

  it("should render the Our Mission section", () => {
    render(
      <MemoryRouter>
        <AboutPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: /our mission/i }),
    ).toBeInTheDocument();
  });

  it("should render the Our Story section", () => {
    render(
      <MemoryRouter>
        <AboutPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: /our story/i }),
    ).toBeInTheDocument();
  });

  it("should render the What We Do section", () => {
    render(
      <MemoryRouter>
        <AboutPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: /what we do/i }),
    ).toBeInTheDocument();
  });

  it("should render the Our Values section", () => {
    render(
      <MemoryRouter>
        <AboutPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: /our values/i }),
    ).toBeInTheDocument();
  });

  it("should render the Get in Touch section", () => {
    render(
      <MemoryRouter>
        <AboutPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: /get in touch/i }),
    ).toBeInTheDocument();
  });

  it("should render the contact email", () => {
    render(
      <MemoryRouter>
        <AboutPage />
      </MemoryRouter>,
    );

    const emailLink = screen.getByRole("link", {
      name: /info@tuusimago.com/i,
    });
    expect(emailLink).toBeInTheDocument();
    expect(emailLink).toHaveAttribute("href", "mailto:info@tuusimago.com");
  });

  it("should render the contact phone number", () => {
    render(
      <MemoryRouter>
        <AboutPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(/\+48 123 456 789/)).toBeInTheDocument();
  });

  it("should render the contact address", () => {
    render(
      <MemoryRouter>
        <AboutPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByText(/123 Innovation Street, Warsaw, Poland/),
    ).toBeInTheDocument();
  });

  it("should render all value cards", () => {
    render(
      <MemoryRouter>
        <AboutPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(/quality first/i)).toBeInTheDocument();
    expect(screen.getByText(/customer satisfaction/i)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /innovation/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/sustainability/i)).toBeInTheDocument();
  });

  it("should render all service cards", () => {
    render(
      <MemoryRouter>
        <AboutPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: /ai enhancement/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /canvas printing/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /custom framing/i }),
    ).toBeInTheDocument();
  });
});
