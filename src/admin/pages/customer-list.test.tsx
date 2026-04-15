import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { CustomerListPage } from "./customer-list";

const mockUseCustom = vi.fn();

vi.mock("@refinedev/core", () => ({
  useCustom: (...args: unknown[]) => mockUseCustom(...args),
}));

vi.mock("@/admin/lib/get-auth-headers", () => ({
  getAuthHeaders: vi.fn().mockResolvedValue({ Authorization: "Bearer test" }),
}));

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

const CUSTOMERS = [
  {
    customer_email: "john@example.com",
    customer_name: "John Doe",
    order_count: 3,
    total_revenue: 597,
    last_order_date: "2025-01-15T10:00:00Z",
    marketing_consent: true,
  },
  {
    customer_email: "jane@example.com",
    customer_name: "Jane Smith",
    order_count: 1,
    total_revenue: 199,
    last_order_date: "2025-01-10T10:00:00Z",
    marketing_consent: false,
  },
];

function setupMocks(customers: Array<Record<string, unknown>> = CUSTOMERS) {
  mockUseCustom.mockReturnValue({
    query: { isFetching: false },
    result: { data: customers },
  });
}

function renderCustomerList() {
  return render(
    <MemoryRouter initialEntries={["/admin/customers"]}>
      <Routes>
        <Route path="/admin/customers" element={<CustomerListPage />} />
        <Route path="/admin/customers/:email" element={<div>Customer Show</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("CustomerListPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders customer table with data", () => {
    setupMocks();
    renderCustomerList();

    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("jane@example.com")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("filters customers by search", async () => {
    setupMocks();
    renderCustomerList();

    const searchInput = screen.getByPlaceholderText("Szukaj klientów...");
    await userEvent.type(searchInput, "john");

    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.queryByText("Jane Smith")).not.toBeInTheDocument();
  });

  it("triggers CSV export", async () => {
    setupMocks();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve("email,name\njohn@example.com,John Doe"),
    });
    renderCustomerList();

    const exportButton = screen.getByText("Eksportuj CSV");
    await userEvent.click(exportButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/.netlify/functions/admin-api",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining('"export":true'),
        }),
      );
    });
  });
});
