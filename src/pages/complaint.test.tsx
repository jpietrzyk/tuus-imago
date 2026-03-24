import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { ComplaintPage } from "./complaint";
import { tr } from "@/test/i18n-test";

describe("ComplaintPage Component", () => {
  it("should render the complaint page title", () => {
    render(
      <MemoryRouter>
        <ComplaintPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      tr("complaint.title"),
    );
  });

  it("should render the page subtitle", () => {
    render(
      <MemoryRouter>
        <ComplaintPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(tr("complaint.subtitle"))).toBeInTheDocument();
  });

  it("should render the back to home link", () => {
    render(
      <MemoryRouter>
        <ComplaintPage />
      </MemoryRouter>,
    );

    const backLink = screen.getByRole("link", {
      name: tr("common.backToHome"),
    });
    expect(backLink).toBeInTheDocument();
    expect(backLink).toHaveAttribute("href", "/");
  });

  it("should render the complaint info section", () => {
    render(
      <MemoryRouter>
        <ComplaintPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: tr("complaint.info.title") }),
    ).toBeInTheDocument();
  });

  it("should render the complaint form section", () => {
    render(
      <MemoryRouter>
        <ComplaintPage />
      </MemoryRouter>,
    );

    // There might be multiple headings with the same text
    expect(
      screen.getAllByRole("heading", { name: tr("complaint.form.title") })
        .length,
    ).toBeGreaterThan(0);
  });

  it("should render the customer info in form", () => {
    render(
      <MemoryRouter>
        <ComplaintPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", {
        name: tr("complaint.form.customerInfo.title"),
      }),
    ).toBeInTheDocument();
  });

  it("should render the order info in form", () => {
    render(
      <MemoryRouter>
        <ComplaintPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", {
        name: tr("complaint.form.orderInfo.title"),
      }),
    ).toBeInTheDocument();
  });

  it("should render the product info in form", () => {
    render(
      <MemoryRouter>
        <ComplaintPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", {
        name: tr("complaint.form.productInfo.title"),
      }),
    ).toBeInTheDocument();
  });

  it("should render the details section in form", () => {
    render(
      <MemoryRouter>
        <ComplaintPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: tr("complaint.form.details.title") }),
    ).toBeInTheDocument();
  });

  it("should render the photos section in form", () => {
    render(
      <MemoryRouter>
        <ComplaintPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: tr("complaint.form.photos.title") }),
    ).toBeInTheDocument();
  });

  it("should render the submit button", () => {
    render(
      <MemoryRouter>
        <ComplaintPage />
      </MemoryRouter>,
    );

    const submitButton = screen.getByRole("button", {
      name: tr("complaint.form.submit"),
    });
    expect(submitButton).toBeInTheDocument();
  });

  it("should render the contact info section", () => {
    render(
      <MemoryRouter>
        <ComplaintPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: tr("complaint.contact.title") }),
    ).toBeInTheDocument();
  });
});
