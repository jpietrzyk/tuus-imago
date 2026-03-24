import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { PrivacyPage } from "./privacy";
import { tr } from "@/test/i18n-test";

describe("PrivacyPage Component", () => {
  it("should render the privacy page title", () => {
    render(
      <MemoryRouter>
        <PrivacyPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      tr("privacy.title"),
    );
  });

  it("should render the page subtitle", () => {
    render(
      <MemoryRouter>
        <PrivacyPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(tr("privacy.subtitle"))).toBeInTheDocument();
  });

  it("should render the back to home link", () => {
    render(
      <MemoryRouter>
        <PrivacyPage />
      </MemoryRouter>,
    );

    const backLink = screen.getByRole("link", {
      name: tr("common.backToHome"),
    });
    expect(backLink).toBeInTheDocument();
    expect(backLink).toHaveAttribute("href", "/");
  });

  it("should render the data controller section", () => {
    render(
      <MemoryRouter>
        <PrivacyPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: tr("privacy.dataController.title") }),
    ).toBeInTheDocument();
  });

  it("should render the types of data section", () => {
    render(
      <MemoryRouter>
        <PrivacyPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: tr("privacy.typesOfData.title") }),
    ).toBeInTheDocument();
  });

  it("should render the legal basis section", () => {
    render(
      <MemoryRouter>
        <PrivacyPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: tr("privacy.legalBasis.title") }),
    ).toBeInTheDocument();
  });

  it("should render the data purposes section", () => {
    render(
      <MemoryRouter>
        <PrivacyPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: tr("privacy.dataPurposes.title") }),
    ).toBeInTheDocument();
  });

  it("should render the data sharing section", () => {
    render(
      <MemoryRouter>
        <PrivacyPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: tr("privacy.dataSharing.title") }),
    ).toBeInTheDocument();
  });

  it("should render the data storage section", () => {
    render(
      <MemoryRouter>
        <PrivacyPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: tr("privacy.dataStorage.title") }),
    ).toBeInTheDocument();
  });

  it("should render the user rights section", () => {
    render(
      <MemoryRouter>
        <PrivacyPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: tr("privacy.userRights.title") }),
    ).toBeInTheDocument();
  });

  it("should render the cookies section", () => {
    render(
      <MemoryRouter>
        <PrivacyPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: tr("privacy.cookies.title") }),
    ).toBeInTheDocument();
  });

  it("should render the data security section", () => {
    render(
      <MemoryRouter>
        <PrivacyPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: tr("privacy.dataSecurity.title") }),
    ).toBeInTheDocument();
  });

  it("should render the contact section", () => {
    render(
      <MemoryRouter>
        <PrivacyPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: tr("privacy.contact.title") }),
    ).toBeInTheDocument();
  });

  it("should render the contact email", () => {
    render(
      <MemoryRouter>
        <PrivacyPage />
      </MemoryRouter>,
    );

    // Email is rendered as text, not a link
    expect(screen.getByText(tr("privacy.contact.email"))).toBeInTheDocument();
  });
});
