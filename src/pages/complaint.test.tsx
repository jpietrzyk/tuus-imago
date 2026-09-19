import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, it, expect, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { ComplaintPage } from "./complaint";
import { tr } from "@/test/i18n-test";

vi.mock("@/lib/content-loader", () => ({
  getPageBySlug: vi.fn((slug: string) =>
    slug === "complaint"
      ? {
          title: "Test Title",
          subtitle: "Test Subtitle",
          slug: "complaint",
          icon: "AlertCircle",
          menuSection: "legal",
          menuOrder: 10,
          lastUpdated: "2025-03-01",
          body: "## Section One\n\n## Section Two",
        }
      : undefined,
  ),
  getAllPages: vi.fn(() => []),
  getPagesBySection: vi.fn(() => []),
}));

describe("ComplaintPage Component", () => {
  it("should render the page heading", () => {
    render(
      <MemoryRouter>
        <ComplaintPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
  });

  it("should render the close button", () => {
    render(
      <MemoryRouter>
        <ComplaintPage />
      </MemoryRouter>,
    );

    const closeButton = screen.getByRole("button", {
      name: tr("common.backToHome"),
    });
    expect(closeButton).toBeInTheDocument();
  });

  it("should render the complaint form section", () => {
    render(
      <MemoryRouter>
        <ComplaintPage />
      </MemoryRouter>,
    );

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

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function fillRequiredFields() {
    fireEvent.change(document.getElementById("name") as HTMLInputElement, {
      target: { value: "Jane Doe" },
    });
    fireEvent.change(document.getElementById("email") as HTMLInputElement, {
      target: { value: "jane@example.com" },
    });
    fireEvent.change(
      document.getElementById("orderNumber") as HTMLInputElement,
      { target: { value: "TI-2026-000001" } },
    );
    fireEvent.change(
      document.getElementById("complaintType") as HTMLSelectElement,
      { target: { value: "damaged" } },
    );
    fireEvent.change(
      document.getElementById("description") as HTMLTextAreaElement,
      { target: { value: "The frame arrived cracked." } },
    );
  }

  it("submits the complaint and shows a success message", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(
      <MemoryRouter>
        <ComplaintPage />
      </MemoryRouter>,
    );

    fillRequiredFields();
    fireEvent.submit(document.querySelector("form") as HTMLFormElement);

    await waitFor(() => {
      expect(
        screen.getByText(tr("complaint.form.success")),
      ).toBeInTheDocument();
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/.netlify/functions/submit-complaint",
      expect.objectContaining({ method: "POST" }),
    );
    const body = JSON.parse(
      (fetchMock.mock.calls[0][1] as RequestInit).body as string,
    );
    expect(body).toMatchObject({
      name: "Jane Doe",
      email: "jane@example.com",
      orderNumber: "TI-2026-000001",
      complaintType: "damaged",
    });
  });

  it("shows an error message when the submission fails", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: "nope" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(
      <MemoryRouter>
        <ComplaintPage />
      </MemoryRouter>,
    );

    fillRequiredFields();
    fireEvent.submit(document.querySelector("form") as HTMLFormElement);

    await waitFor(() => {
      expect(
        screen.getByText(tr("complaint.form.error")),
      ).toBeInTheDocument();
    });
  });
});
