import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { ShippingCreatePage } from "./shipping-create";

vi.mock("@/admin/lib/get-auth-headers", () => ({
  getAuthHeaders: vi.fn().mockResolvedValue({ Authorization: "Bearer test" }),
}));

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function renderShippingCreate() {
  return render(
    <MemoryRouter initialEntries={["/admin/shipping/new"]}>
      <Routes>
        <Route path="/admin/shipping/new" element={<ShippingCreatePage />} />
        <Route path="/admin/shipping" element={<div>Shipping List</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ShippingCreatePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders form fields", () => {
    renderShippingCreate();

    expect(screen.getByText("Nowa metoda dostawy")).toBeInTheDocument();
    expect(screen.getByLabelText("Nazwa kuriera")).toBeInTheDocument();
    expect(screen.getByLabelText("Opis")).toBeInTheDocument();
    expect(screen.getByLabelText("Cena")).toBeInTheDocument();
    expect(screen.getByLabelText("Czas dostawy")).toBeInTheDocument();
    expect(screen.getByLabelText("Darmowa dostawa od")).toBeInTheDocument();
    expect(screen.getByLabelText("Kolejność sortowania")).toBeInTheDocument();
    expect(screen.getByLabelText("Aktywne")).toBeInTheDocument();
    expect(screen.getByLabelText("Domyślna")).toBeInTheDocument();
  });

  it("submits courier, price and delivery time", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: { id: "new" } }),
    });
    renderShippingCreate();

    await userEvent.type(
      screen.getByLabelText("Nazwa kuriera"),
      "InPost Paczkomat",
    );
    await userEvent.type(screen.getByLabelText("Cena"), "12.50");
    await userEvent.type(screen.getByLabelText("Czas dostawy"), "1-2 dni");

    await userEvent.click(screen.getByText("Utwórz metodę dostawy"));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/.netlify/functions/admin-api",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining("InPost Paczkomat"),
        }),
      );
    });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body as string);
    expect(body.resource).toBe("shipping_methods");
    expect(body.data).toMatchObject({
      name: "InPost Paczkomat",
      price: 12.5,
      delivery_time: "1-2 dni",
      currency: "PLN",
    });
  });

  it("sends the free shipping threshold when provided", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: { id: "new" } }),
    });
    renderShippingCreate();

    await userEvent.type(screen.getByLabelText("Nazwa kuriera"), "Kurier");
    await userEvent.type(screen.getByLabelText("Cena"), "20");
    await userEvent.type(screen.getByLabelText("Darmowa dostawa od"), "300");

    await userEvent.click(screen.getByText("Utwórz metodę dostawy"));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body as string);
    expect(body.data.free_shipping_threshold).toBe(300);
  });

  it("sends a null free shipping threshold when left empty", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: { id: "new" } }),
    });
    renderShippingCreate();

    await userEvent.type(screen.getByLabelText("Nazwa kuriera"), "Kurier");
    await userEvent.type(screen.getByLabelText("Cena"), "20");

    await userEvent.click(screen.getByText("Utwórz metodę dostawy"));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body as string);
    expect(body.data.free_shipping_threshold).toBeNull();
  });

  it("shows error on failed creation", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: "Server error" }),
    });
    renderShippingCreate();

    await userEvent.type(screen.getByLabelText("Nazwa kuriera"), "Test");
    await userEvent.type(screen.getByLabelText("Cena"), "10");

    await userEvent.click(screen.getByText("Utwórz metodę dostawy"));

    await waitFor(() => {
      expect(screen.getByText("Server error")).toBeInTheDocument();
    });
  });

  it("does not submit without required fields", async () => {
    renderShippingCreate();

    await userEvent.click(screen.getByText("Utwórz metodę dostawy"));

    expect(mockFetch).not.toHaveBeenCalled();
  });
});
