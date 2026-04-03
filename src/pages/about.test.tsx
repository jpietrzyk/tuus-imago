import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { AboutPage } from "./about";
import { t } from "@/locales/i18n";

describe("AboutPage Component", () => {
  it("should render the about page title", () => {
    render(
      <MemoryRouter>
        <AboutPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "O nas",
    );
  });

  it("should render the page description", () => {
    render(
      <MemoryRouter>
        <AboutPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("Dowiedz się więcej o Tuus Imago i naszej misji")).toBeInTheDocument();
  });

  it("should render the home navigation link", () => {
    render(
      <MemoryRouter>
        <AboutPage />
      </MemoryRouter>,
    );

    const backLink = screen.getByRole("link", {
      name: t("common.backToHome"),
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
      screen.getByRole("heading", { name: "Nasza misja" }),
    ).toBeInTheDocument();
  });

  it("should render the story section", () => {
    render(
      <MemoryRouter>
        <AboutPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: "Nasza historia" }),
    ).toBeInTheDocument();
  });

  it("should render the what-we-do section", () => {
    render(
      <MemoryRouter>
        <AboutPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: "Co robimy" }),
    ).toBeInTheDocument();
  });

  it("should render the values section", () => {
    render(
      <MemoryRouter>
        <AboutPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: "Nasze wartości" }),
    ).toBeInTheDocument();
  });

  it("should render the contact section", () => {
    render(
      <MemoryRouter>
        <AboutPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: "Skontaktuj się z nami" }),
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

  it("should render value items", () => {
    render(
      <MemoryRouter>
        <AboutPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Jakość w pierwszej kolejności/)).toBeInTheDocument();
    expect(screen.getByText(/Satysfakcja klienta/)).toBeInTheDocument();
    expect(screen.getByText(/Innowacja/)).toBeInTheDocument();
    expect(screen.getByText(/Zrównoważony rozwój/)).toBeInTheDocument();
  });
});
