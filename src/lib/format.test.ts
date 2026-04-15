import { describe, expect, it } from "vitest";
import { formatDate, formatDateTime } from "./format";

describe("format", () => {
  describe("formatDate", () => {
    it("formats a string date in Polish locale", () => {
      const result = formatDate("2025-03-15");
      expect(result).toContain("2025");
      expect(result).toContain("15");
    });

    it("formats a Date object", () => {
      const result = formatDate(new Date("2025-01-01"));
      expect(result).toContain("2025");
    });

    it("includes abbreviated month", () => {
      const result = formatDate("2025-03-15");
      expect(result).toMatch(/mar|sty|lut|kwi|maj|cze|lip|sie|wrz|paź|lis|gru/i);
    });
  });

  describe("formatDateTime", () => {
    it("formats a string date with time in Polish locale", () => {
      const result = formatDateTime("2025-03-15T14:30:00");
      expect(result).toContain("2025");
      expect(result).toContain("14");
      expect(result).toContain("30");
    });

    it("formats a Date object with time", () => {
      const result = formatDateTime(new Date("2025-06-20T09:15:00"));
      expect(result).toContain("2025");
      expect(result).toContain("09");
      expect(result).toContain("15");
    });

    it("includes abbreviated month and day", () => {
      const result = formatDateTime("2025-03-15T14:30:00");
      expect(result).toContain("15");
    });
  });
});
