import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";

const mockUseOne = vi.fn();
const mockUseCustom = vi.fn();
const mockCreateRef = vi.fn();
const mockDeleteRef = vi.fn();

vi.mock("@refinedev/core", () => ({
  useOne: (...args: unknown[]) => mockUseOne(...args),
  useCustom: (...args: unknown[]) => mockUseCustom(...args),
  useCreate: () => ({ mutateAsync: mockCreateRef }),
  useDelete: () => ({ mutateAsync: mockDeleteRef }),
}));

vi.mock("@/admin/lib/get-auth-headers", () => ({
  getAuthHeaders: vi.fn().mockResolvedValue({ Authorization: "Bearer test" }),
}));

vi.mock("@/admin/components/ref-qr-code-dialog", () => ({
  RefQrCodeDialog: ({ refCode }: { refCode: string }) => (
    <div data-testid="qr-dialog">QR for {refCode}</div>
  ),
}));

import { PartnerShowPage } from "./partner-show";

const PARTNER = {
  id: "p-1",
  company_name: "Art Gallery",
  contact_name: "Jan Kowalski",
  nip: "1234567890",
  contact_email: "art@gallery.com",
  phone: "+48123456789",
  city: "Warsaw",
  address: "ul. Artystów 5",
  notes: "VIP partner",
  is_active: true,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2025-01-01T00:00:00Z",
};

const STATS = {
  partner_id: "p-1",
  coupon_count: 3,
  coupons: [
    { id: "c-1", code: "SUMMER20", discount_type: "percentage", discount_value: 20, used_count: 5, is_active: true },
  ],
  total_orders: 15,
  total_revenue: 2985,
  last_order_date: "2025-01-15T00:00:00Z",
  ref_count: 2,
  refs: [
    { id: "r-1", ref_code: "gallery-warsaw", label: "Gallery Warsaw", is_active: true, created_at: "2025-01-01T00:00:00Z", event_count: 42 },
  ],
  total_ref_events: 42,
};

function setupMocks(partner: Record<string, unknown> | null = PARTNER, stats = STATS) {
  mockUseOne.mockReturnValue({
    query: { isFetching: false },
    result: partner,
  });
  mockUseCustom.mockReturnValue({
    result: { data: stats },
    query: { isFetching: false, refetch: vi.fn() },
  });
}

function renderPartnerShow(id = "p-1") {
  return render(
    <MemoryRouter initialEntries={[`/admin/partners/${id}`]}>
      <Routes>
        <Route path="/admin/partners/:id" element={<PartnerShowPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("PartnerShowPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders partner details with stats", () => {
    setupMocks();
    renderPartnerShow();

    expect(screen.getAllByText("Art Gallery").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Jan Kowalski")).toBeInTheDocument();
    expect(screen.getByText("15")).toBeInTheDocument();
  });

  it("renders coupons list", () => {
    setupMocks();
    renderPartnerShow();

    expect(screen.getByText("SUMMER20")).toBeInTheDocument();
    expect(screen.getByText("20%")).toBeInTheDocument();
  });

  it("renders refs with event count", () => {
    setupMocks();
    renderPartnerShow();

    expect(screen.getByText("gallery-warsaw")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("shows not found when partner is null", () => {
    setupMocks(null, null);
    renderPartnerShow("nonexistent");

    expect(screen.getByText("Partner nie znaleziony.")).toBeInTheDocument();
  });
});
