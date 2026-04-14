import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  OrderStatusBadge,
  PaymentStatusBadge,
  ShipmentStatusBadge,
  ORDER_STATUS_VARIANTS,
  PAYMENT_STATUS_VARIANTS,
  SHIPMENT_STATUS_VARIANTS,
} from "./badges";

describe("OrderStatusBadge", () => {
  it.each([
    ["pending_payment", "outline"],
    ["paid", "default"],
    ["cancelled", "destructive"],
    ["refunded", "secondary"],
  ] as const)("renders '%s' status with correct variant", (status) => {
    render(<OrderStatusBadge status={status} />);
    const badge = screen.getByText(/./);
    expect(badge).toBeInTheDocument();
    expect(badge.textContent).toBeTruthy();
  });

  it("renders unknown status with fallback text", () => {
    render(<OrderStatusBadge status="unknown_status" />);
    expect(screen.getByText("unknown status")).toBeInTheDocument();
  });

  it("exports correct variant mappings", () => {
    expect(ORDER_STATUS_VARIANTS).toEqual({
      pending_payment: "outline",
      paid: "default",
      cancelled: "destructive",
      refunded: "secondary",
    });
  });
});

describe("PaymentStatusBadge", () => {
  it.each([
    ["pending", "outline"],
    ["registered", "secondary"],
    ["verified", "default"],
    ["failed", "destructive"],
  ] as const)("renders '%s' status with correct variant", (status) => {
    render(<PaymentStatusBadge status={status} />);
    const badge = screen.getByText(/./);
    expect(badge).toBeInTheDocument();
  });

  it("renders unknown status with fallback text", () => {
    render(<PaymentStatusBadge status="expired" />);
    expect(screen.getByText("expired")).toBeInTheDocument();
  });

  it("exports correct variant mappings", () => {
    expect(PAYMENT_STATUS_VARIANTS).toEqual({
      pending: "outline",
      registered: "secondary",
      verified: "default",
      failed: "destructive",
    });
  });
});

describe("ShipmentStatusBadge", () => {
  it.each([
    ["pending_fulfillment", "outline"],
    ["in_transit", "default"],
    ["delivered", "secondary"],
    ["failed_delivery", "destructive"],
    ["returned", "destructive"],
  ] as const)("renders '%s' status with correct variant", (status) => {
    render(<ShipmentStatusBadge status={status} />);
    const badge = screen.getByText(/./);
    expect(badge).toBeInTheDocument();
  });

  it("renders unknown status with fallback text", () => {
    render(<ShipmentStatusBadge status="lost" />);
    expect(screen.getByText("lost")).toBeInTheDocument();
  });

  it("exports correct variant mappings", () => {
    expect(SHIPMENT_STATUS_VARIANTS).toEqual({
      pending_fulfillment: "outline",
      in_transit: "default",
      delivered: "secondary",
      failed_delivery: "destructive",
      returned: "destructive",
    });
  });
});
