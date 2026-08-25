import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { FrameCreatePage } from "./frame-create";

vi.mock("@/admin/lib/get-auth-headers", () => ({
  getAuthHeaders: vi.fn().mockResolvedValue({ Authorization: "Bearer test" }),
}));

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function renderFrameCreate() {
  return render(
    <MemoryRouter initialEntries={["/admin/frames/new"]}>
      <Routes>
        <Route path="/admin/frames/new" element={<FrameCreatePage />} />
        <Route path="/admin/frames" element={<div>Frames List</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("FrameCreatePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders form fields", () => {
    renderFrameCreate();

    expect(screen.getByText("Nowa ramka")).toBeInTheDocument();
    expect(screen.getByLabelText("Nazwa")).toBeInTheDocument();
    expect(screen.getByLabelText("Opis")).toBeInTheDocument();
    expect(screen.getByLabelText("Cena")).toBeInTheDocument();
    expect(screen.getByLabelText("Adres URL obrazka")).toBeInTheDocument();
    expect(screen.getByLabelText("Kolor (hex)")).toBeInTheDocument();
    expect(screen.getByLabelText("Materiał")).toBeInTheDocument();
    expect(screen.getByLabelText("Kolejność sortowania")).toBeInTheDocument();
    expect(screen.getByLabelText("Aktywne")).toBeInTheDocument();
    expect(screen.getByLabelText("Domyślna")).toBeInTheDocument();
  });

  it("submits form with correct payload", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ data: { id: "new" } }) });
    renderFrameCreate();

    await userEvent.type(screen.getByLabelText("Nazwa"), "Oak Classic");
    await userEvent.type(screen.getByLabelText("Cena"), "49");
    await userEvent.type(screen.getByLabelText("Kolor (hex)"), "#c8a165");
    await userEvent.type(screen.getByLabelText("Materiał"), "oak wood");

    const submitButton = screen.getByText("Utwórz ramkę");
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/.netlify/functions/admin-api",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining("Oak Classic"),
        }),
      );
    });
  });

  it("shows error on failed creation", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({ error: "Server error" }) });
    renderFrameCreate();

    await userEvent.type(screen.getByLabelText("Nazwa"), "Test");
    await userEvent.type(screen.getByLabelText("Cena"), "10");

    const submitButton = screen.getByText("Utwórz ramkę");
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Server error")).toBeInTheDocument();
    });
  });

  it("does not submit without required fields", async () => {
    renderFrameCreate();

    const submitButton = screen.getByText("Utwórz ramkę");
    await userEvent.click(submitButton);

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("sends is_active true by default", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ data: { id: "new" } }) });
    renderFrameCreate();

    await userEvent.type(screen.getByLabelText("Nazwa"), "Test Frame");
    await userEvent.type(screen.getByLabelText("Cena"), "15");

    const submitButton = screen.getByText("Utwórz ramkę");
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
