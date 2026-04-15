import { describe, expect, it } from "vitest";
import { CANVAS_PRINT_UNIT_PRICE, formatPrice } from "./pricing";

describe("pricing", () => {
  describe("CANVAS_PRINT_UNIT_PRICE", () => {
    it("is 200", () => {
      expect(CANVAS_PRINT_UNIT_PRICE).toBe(200);
    });
  });

  describe("formatPrice", () => {
    it("formats zero", () => {
      expect(formatPrice(0)).toMatch(/0/);
    });

    it("formats integer price", () => {
      expect(formatPrice(200)).toMatch(/200/);
    });

    it("formats decimal price", () => {
      expect(formatPrice(99.99)).toMatch(/99[,.]99/);
    });

    it("formats large number", () => {
      expect(formatPrice(10000)).toContain("10");
    });

    it("uses PLN currency", () => {
      const result = formatPrice(200);
      expect(result).toMatch(/PLN|zł/);
    });
  });
});
