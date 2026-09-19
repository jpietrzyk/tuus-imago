import { describe, expect, it, vi } from "vitest";
import { fetchAllRows } from "../functions/_shared/fetch-all";

function makeRows(count: number, offset = 0) {
  return Array.from({ length: count }, (_, index) => ({ id: offset + index }));
}

describe("fetchAllRows", () => {
  it("pages until a short batch is returned", async () => {
    const page = vi
      .fn()
      .mockResolvedValueOnce({ data: makeRows(1000), error: null })
      .mockResolvedValueOnce({ data: makeRows(5, 1000), error: null });

    const result = await fetchAllRows<{ id: number }>(page, 1000);

    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(1005);
    expect(page).toHaveBeenCalledTimes(2);
    expect(page).toHaveBeenNthCalledWith(1, 0, 999);
    expect(page).toHaveBeenNthCalledWith(2, 1000, 1999);
  });

  it("stops and returns partial data on error", async () => {
    const page = vi
      .fn()
      .mockResolvedValueOnce({ data: makeRows(1000), error: null })
      .mockResolvedValueOnce({ data: null, error: { message: "boom" } });

    const result = await fetchAllRows<{ id: number }>(page, 1000);

    expect(result.data).toHaveLength(1000);
    expect(result.error).toEqual({ message: "boom" });
    expect(page).toHaveBeenCalledTimes(2);
  });

  it("caps the number of pages", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const page = vi
      .fn()
      .mockResolvedValue({ data: makeRows(1000), error: null });

    const result = await fetchAllRows<{ id: number }>(page, 1000, 2);

    expect(result.data).toHaveLength(2000);
    expect(page).toHaveBeenCalledTimes(2);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
