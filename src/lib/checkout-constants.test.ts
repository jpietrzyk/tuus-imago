import { describe, expect, it } from "vitest";
import { SHIPPING_COUNTRIES } from "./checkout-constants";

describe("checkout-constants", () => {
  describe("SHIPPING_COUNTRIES", () => {
    it("is an array of objects with value and label", () => {
      expect(Array.isArray(SHIPPING_COUNTRIES)).toBe(true);
      SHIPPING_COUNTRIES.forEach((country) => {
        expect(country).toHaveProperty("value");
        expect(country).toHaveProperty("label");
        expect(typeof country.value).toBe("string");
        expect(typeof country.label).toBe("string");
      });
    });

    it("contains Poland", () => {
      const poland = SHIPPING_COUNTRIES.find((c) => c.value === "PL");
      expect(poland).toBeDefined();
      expect(poland!.label).toBe("Poland");
    });

    it("contains Germany", () => {
      const germany = SHIPPING_COUNTRIES.find((c) => c.value === "DE");
      expect(germany).toBeDefined();
      expect(germany!.label).toBe("Germany");
    });

    it("contains 31 countries", () => {
      expect(SHIPPING_COUNTRIES).toHaveLength(31);
    });

    it("has unique country codes", () => {
      const codes = SHIPPING_COUNTRIES.map((c) => c.value);
      expect(new Set(codes).size).toBe(codes.length);
    });

    it("all country codes are 2-letter uppercase strings", () => {
      SHIPPING_COUNTRIES.forEach((country) => {
        expect(country.value).toMatch(/^[A-Z]{2}$/);
      });
    });

    it("matches snapshot", () => {
      expect(SHIPPING_COUNTRIES).toMatchSnapshot();
    });
  });
});
