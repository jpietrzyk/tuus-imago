import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { CouponCreatePage } from "./coupon-create";

const mockUseList = vi.fn();

vi.mock("@refinedev/core", () => ({
  useList: (...args: unknown[]) => mockUseList(...args),
}));

vi.mock("@/admin/lib/get-auth-headers", () => ({
  getAuthHeaders: vi.fn().mockResolvedValue({ Authorization: "Bearer test" }),
}));

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function setupMocks() {
  mockUseList.mockReturnValue({
    result: { data: [{ id: "p-1", company_name: "Art Gallery" }] },
  });
}

function renderCouponCreate() {
  return render(
    <MemoryRouter initialEntries={["/admin/coupons/new"]}>
      <Routes>
        <Route path="/admin/coupons/new" element={<CouponCreatePage />} />
        <Route path="/admin/coupons" element={<div>Coupons List</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("CouponCreatePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders form fields", () => {
    setupMocks();
    renderCouponCreate();

    expect(screen.getByText("Nowy kupon")).toBeInTheDocument();
    expect(screen.getByLabelText("Kod")).toBeInTheDocument();
    expect(screen.getByText("Typ rabatu")).toBeInTheDocument();
    expect(screen.getByLabelText("Wartość rabatu")).toBeInTheDocument();
  });

  it("submits form with correct payload", async () => {
    setupMocks();
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ data: { id: "new" } }) });
    renderCouponCreate();

    await userEvent.type(screen.getByLabelText("Kod"), "SUMMER20");
    await userEvent.type(screen.getByLabelText("Wartość rabatu"), "20");

    const submitButton = screen.getByText("Utwórz kupon");
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/.netlify/functions/admin-api",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining('"code":"SUMMER20"'),
        }),
      );
    });
  });

  it("shows error on failed creation", async () => {
    setupMocks();
    mockFetch.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({ error: "Duplicate code" }) });
    renderCouponCreate();

    await userEvent.type(screen.getByLabelText("Kod"), "DUP");
    await userEvent.type(screen.getByLabelText("Wartość rabatu"), "10");

    const submitButton = screen.getByText("Utwórz kupon");
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Duplicate code")).toBeInTheDocument();
    });
  });
});
