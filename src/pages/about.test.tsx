import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { AboutPage } from "./about";
import { tr } from "@/test/i18n-test";

describe("AboutPage Component", () => {
  it("should render the about page title", () => {
    render(
      <MemoryRouter>
        <AboutPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      tr("about.title"),
    );
  });

  it("should render the page description", () => {
    render(
      <MemoryRouter>
        <AboutPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(tr("about.subtitle"))).toBeInTheDocument();
  });

  it("should render the home navigation link", () => {
    render(
      <MemoryRouter>
        <AboutPage />
      </MemoryRouter>,
    );

    const backLink = screen.getByRole("link", {
      name: tr("common.backToHome"),
    });
    expect(backLink).toBeInTheDocument();
    expect(backLink).toHaveAttribute("href", "/");
  });

  it("should render the mission section", () => {
    render(
      <MemoryRouter>
        <AboutPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: tr("about.mission.title") }),
    ).toBeInTheDocument();
  });

  it("should render the story section", () => {
    render(
      <MemoryRouter>
        <AboutPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: tr("about.story.title") }),
    ).toBeInTheDocument();
  });

  it("should render the what-we-do section", () => {
    render(
      <MemoryRouter>
        <AboutPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: tr("about.whatWeDo.title") }),
    ).toBeInTheDocument();
  });

  it("should render the values section", () => {
    render(
      <MemoryRouter>
        <AboutPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: tr("about.values.title") }),
    ).toBeInTheDocument();
  });

  it("should render the contact section", () => {
    render(
      <MemoryRouter>
        <AboutPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: tr("about.contact.title") }),
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

    expect(
      screen.getByText(tr("about.values.qualityFirst.label")),
    ).toBeInTheDocument();
    expect(
      screen.getByText(tr("about.values.customerSatisfaction.label")),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: tr("about.values.innovation.label"),
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(tr("about.values.sustainability.label")),
    ).toBeInTheDocument();
  });

  it("should render all service cards", () => {
    render(
      <MemoryRouter>
        <AboutPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", {
        name: tr("about.whatWeDo.aiEnhancement.label"),
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: tr("about.whatWeDo.canvasPrinting.label"),
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: tr("about.whatWeDo.customFraming.label"),
      }),
    ).toBeInTheDocument();
  });
});
