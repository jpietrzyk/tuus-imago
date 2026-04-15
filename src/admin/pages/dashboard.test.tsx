import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

vi.mock("recharts", () => {
  const createComponent = (name: string) => {
    const Comp = () => null;
    Comp.displayName = name;
    return Comp;
  };
  return {
    AreaChart: createComponent("AreaChart"),
    Area: createComponent("Area"),
    XAxis: createComponent("XAxis"),
    YAxis: createComponent("YAxis"),
    CartesianGrid: createComponent("CartesianGrid"),
    Tooltip: createComponent("Tooltip"),
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="responsive-container">{children}</div>
    ),
    BarChart: createComponent("BarChart"),
    Bar: createComponent("Bar"),
    PieChart: createComponent("PieChart"),
    Pie: createComponent("Pie"),
    Cell: createComponent("Cell"),
    Legend: createComponent("Legend"),
  };
});

const mockUseCustom = vi.fn();
const mockUseList = vi.fn();

vi.mock("@refinedev/core", () => ({
  useCustom: (...args: unknown[]) => mockUseCustom(...args),
  useList: (...args: unknown[]) => mockUseList(...args),
}));

import { DashboardPage } from "./dashboard";
import { tr } from "@/test/i18n-test";

vi.mock("@/lib/pricing", () => ({
  formatPrice: (price: number) => `${price.toFixed(2).replace(".", ",")} zł`,
  CANVAS_PRINT_UNIT_PRICE: 200,
}));

function setupMocks(overrides: Record<string, unknown> = {}) {
  const defaults = {
    ordersCountResult: { data: { count: 42 } },
    paidOrdersResult: { data: { total_price: 12500 } },
    couponsResult: { total: 5 },
    activeRefsResult: { total: 8 },
    pendingShipmentsResult: { total: 3 },
    recentOrdersResult: {
      data: [],
      total: 0,
    },
    statusBreakdownResult: { data: [] },
    revenueOverTimeResult: { data: [] },
    revenueByMonthResult: { data: [] },
  };
  const data = { ...defaults, ...overrides };

  mockUseCustom.mockImplementation(({ config }: { config: { payload: { meta: Record<string, unknown> } } }) => {
    const fn = config.payload.meta.aggregateFunction;
    if (fn === "count" && !config.payload.meta.groupBy) return { result: { data: data.ordersCountResult.data } };
    if (fn === "sum") return { result: { data: data.paidOrdersResult.data } };
    if (fn === "count" && config.payload.meta.groupBy) return { result: { data: data.statusBreakdownResult.data } };
    if (fn === "revenue_over_time") return { result: { data: data.revenueOverTimeResult.data } };
    if (fn === "revenue_by_month") return { result: { data: data.revenueByMonthResult.data } };
    return { result: { data: null } };
  });

  mockUseList.mockImplementation(({ resource, filters }: { resource: string; filters?: Array<{ field: string; operator: string; value: unknown }> }) => {
    if (resource === "coupons") return { result: data.couponsResult };
    if (resource === "partner_refs") return { result: data.activeRefsResult };
    if (resource === "orders" && filters?.some((f) => f.field === "shipment_status")) return { result: data.pendingShipmentsResult };
    return { result: data.recentOrdersResult };
  });
}

function renderDashboard() {
  return render(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>,
  );
}

describe("DashboardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders KPI cards with correct values", () => {
    setupMocks();
    renderDashboard();

    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText(/12\s*500,00/)).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("renders recent orders table with data", () => {
    setupMocks({
      recentOrdersResult: {
        data: [
          {
            id: "ord-1",
            order_number: "ORD-001",
            status: "paid",
            customer_email: "john@example.com",
            total_price: 199,
            items_count: 1,
            created_at: "2025-01-15T10:00:00Z",
          },
        ],
        total: 1,
      },
    });
    renderDashboard();

    expect(screen.getByText("ORD-001")).toBeInTheDocument();
    expect(screen.getByText("john@example.com")).toBeInTheDocument();
  });

  it("renders empty state when no recent orders", () => {
    setupMocks();
    renderDashboard();

    const emptyTexts = screen.getAllByText(tr("admin.labels.noOrdersYet"));
    expect(emptyTexts.length).toBeGreaterThanOrEqual(1);
  });

  it("renders status breakdown with data", () => {
    setupMocks({
      statusBreakdownResult: {
        data: [
          { status: "paid", count: 10 },
          { status: "pending_payment", count: 7 },
        ],
      },
    });
    renderDashboard();

    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
  });

  it("renders active coupons and refs count", () => {
    setupMocks();
    renderDashboard();

    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();
  });

  it("calls useCustom with correct aggregateFunction values", () => {
    setupMocks();
    renderDashboard();

    const calls = mockUseCustom.mock.calls;
    const fns = calls.map(
      (call: unknown[]) => {
        const config = (call[0] as { config?: { payload?: { meta?: Record<string, unknown> } } }).config;
        return config?.payload?.meta?.aggregateFunction;
      },
    ).filter(Boolean);
    expect(fns).toContain("count");
    expect(fns).toContain("sum");
    expect(fns).toContain("revenue_over_time");
    expect(fns).toContain("revenue_by_month");
  });

  it("renders revenue chart containers with data", () => {
    setupMocks({
      revenueOverTimeResult: {
        data: [{ date: "2025-01-15", revenue: 500, count: 3 }],
      },
      revenueByMonthResult: {
        data: [{ month: "2025-01", revenue: 3000, count: 15 }],
      },
    });
    renderDashboard();

    const containers = screen.getAllByTestId("responsive-container");
    expect(containers.length).toBeGreaterThanOrEqual(2);
  });
});
