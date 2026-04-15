import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { PromotionCreatePage } from "./promotion-create";

vi.mock("@/admin/lib/get-auth-headers", () => ({
  getAuthHeaders: vi.fn().mockResolvedValue({ Authorization: "Bearer test" }),
}));

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function renderPromotionCreate() {
  return render(
    <MemoryRouter initialEntries={["/admin/promotions/new"]}>
      <Routes>
        <Route path="/admin/promotions/new" element={<PromotionCreatePage />} />
        <Route path="/admin/promotions" element={<div>Promotions List</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("PromotionCreatePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders form fields", () => {
    renderPromotionCreate();

    expect(screen.getByText("Nowa promocja")).toBeInTheDocument();
    expect(screen.getByLabelText("Nazwa")).toBeInTheDocument();
    expect(screen.getByLabelText("Slogan")).toBeInTheDocument();
    expect(screen.getByText("Typ rabatu")).toBeInTheDocument();
    expect(screen.getByLabelText("Wartość rabatu")).toBeInTheDocument();
    expect(screen.getByLabelText("Minimalna liczba slotów")).toBeInTheDocument();
  });

  it("submits form with correct payload", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ data: { id: "new" } }) });
    renderPromotionCreate();

    await userEvent.type(screen.getByLabelText("Nazwa"), "Spring Sale");
    await userEvent.type(screen.getByLabelText("Slogan"), "Spring Sale -20%!");
    await userEvent.type(screen.getByLabelText("Wartość rabatu"), "20");

    const submitButton = screen.getByText("Utwórz promocję");
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/.netlify/functions/admin-api",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining("Spring Sale"),
        }),
      );
    });
  });

  it("shows error on failed creation", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({ error: "Server error" }) });
    renderPromotionCreate();

    await userEvent.type(screen.getByLabelText("Nazwa"), "Test");
    await userEvent.type(screen.getByLabelText("Slogan"), "Test slogan");
    await userEvent.type(screen.getByLabelText("Wartość rabatu"), "10");

    const submitButton = screen.getByText("Utwórz promocję");
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Server error")).toBeInTheDocument();
    });
  });

  it("does not submit without required fields", async () => {
    renderPromotionCreate();

    const submitButton = screen.getByText("Utwórz promocję");
    await userEvent.click(submitButton);

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("sends is_active false on creation", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ data: { id: "new" } }) });
    renderPromotionCreate();

    await userEvent.type(screen.getByLabelText("Nazwa"), "Test Promo");
    await userEvent.type(screen.getByLabelText("Slogan"), "Test");
    await userEvent.type(screen.getByLabelText("Wartość rabatu"), "15");

    const submitButton = screen.getByText("Utwórz promocję");
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/.netlify/functions/admin-api",
        expect.objectContaining({
          body: expect.stringContaining('"is_active":false'),
        }),
      );
    });
  });
});
