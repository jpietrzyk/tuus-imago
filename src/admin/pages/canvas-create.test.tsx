import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { CanvasCreatePage } from "./canvas-create";

vi.mock("@/admin/lib/get-auth-headers", () => ({
  getAuthHeaders: vi.fn().mockResolvedValue({ Authorization: "Bearer test" }),
}));

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function renderCanvasCreate() {
  return render(
    <MemoryRouter initialEntries={["/admin/canvases/new"]}>
      <Routes>
        <Route path="/admin/canvases/new" element={<CanvasCreatePage />} />
        <Route path="/admin/canvases" element={<div>Canvases List</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("CanvasCreatePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders form fields", () => {
    renderCanvasCreate();

    expect(screen.getByText("Nowe płótno")).toBeInTheDocument();
    expect(screen.getByLabelText("Nazwa")).toBeInTheDocument();
    expect(screen.getByLabelText("Opis")).toBeInTheDocument();
    expect(screen.getByLabelText("Cena")).toBeInTheDocument();
    expect(screen.getByLabelText("Adres URL obrazka")).toBeInTheDocument();
    expect(screen.getByLabelText("Kolor (hex)")).toBeInTheDocument();
    expect(screen.getByLabelText("Materiał")).toBeInTheDocument();
    expect(screen.getByLabelText("Kolejność sortowania")).toBeInTheDocument();
    expect(screen.getByLabelText("Aktywne")).toBeInTheDocument();
    expect(screen.getByLabelText("Domyślne")).toBeInTheDocument();
  });

  it("submits form with correct payload", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ data: { id: "new" } }) });
    renderCanvasCreate();

    await userEvent.type(screen.getByLabelText("Nazwa"), "Classic Matte");
    await userEvent.type(screen.getByLabelText("Cena"), "39");
    await userEvent.type(screen.getByLabelText("Kolor (hex)"), "#f5f0e6");
    await userEvent.type(screen.getByLabelText("Materiał"), "cotton");

    const submitButton = screen.getByText("Utwórz płótno");
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/.netlify/functions/admin-api",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining("Classic Matte"),
        }),
      );
    });
  });

  it("shows error on failed creation", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({ error: "Server error" }) });
    renderCanvasCreate();

    await userEvent.type(screen.getByLabelText("Nazwa"), "Test");
    await userEvent.type(screen.getByLabelText("Cena"), "10");

    const submitButton = screen.getByText("Utwórz płótno");
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Server error")).toBeInTheDocument();
    });
  });

  it("does not submit without required fields", async () => {
    renderCanvasCreate();

    const submitButton = screen.getByText("Utwórz płótno");
    await userEvent.click(submitButton);

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("sends is_active true by default", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ data: { id: "new" } }) });
    renderCanvasCreate();

    await userEvent.type(screen.getByLabelText("Nazwa"), "Test Canvas");
    await userEvent.type(screen.getByLabelText("Cena"), "15");

    const submitButton = screen.getByText("Utwórz płótno");
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/.netlify/functions/admin-api",
        expect.objectContaining({
          body: expect.stringContaining('"is_active":true'),
        }),
      );
    });
  });
});
