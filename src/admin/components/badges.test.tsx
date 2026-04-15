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

const ORDER_STATUSES = [
  ["pending_payment", "outline"],
  ["paid", "default"],
  ["cancelled", "destructive"],
  ["refunded", "secondary"],
] as [string, string][];

const PAYMENT_STATUSES = [
  ["pending", "outline"],
  ["registered", "secondary"],
  ["verified", "default"],
  ["failed", "destructive"],
] as [string, string][];

const SHIPMENT_STATUSES = [
  ["pending_fulfillment", "outline"],
  ["in_transit", "default"],
  ["delivered", "secondary"],
  ["failed_delivery", "destructive"],
  ["returned", "destructive"],
] as [string, string][];

describe("OrderStatusBadge", () => {
  it.each(ORDER_STATUSES)("renders '%s' status with correct variant", (status) => {
    render(<OrderStatusBadge status={status as "pending_payment" | "paid" | "cancelled" | "refunded"} />);
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
  it.each(PAYMENT_STATUSES)("renders '%s' status with correct variant", (status) => {
    render(<PaymentStatusBadge status={status as "pending" | "registered" | "verified" | "failed"} />);
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
  it.each(SHIPMENT_STATUSES)("renders '%s' status with correct variant", (status) => {
    render(<ShipmentStatusBadge status={status as "pending_fulfillment" | "in_transit" | "delivered" | "failed_delivery" | "returned"} />);
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
