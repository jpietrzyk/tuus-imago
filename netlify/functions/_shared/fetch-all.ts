/**
 * PostgREST caps unbounded `select()` responses (1000 rows by default). Admin
 * aggregates and CSV exports must not silently truncate, so they page through
 * results explicitly with `.range()` until a short batch is returned.
 */
export type FetchAllResult<T> = {
  data: T[];
  error: unknown;
};

export async function fetchAllRows<T>(
  page: (
    from: number,
    to: number,
  ) => PromiseLike<{ data: T[] | null; error: unknown }>,
  chunk = 1000,
  maxPages = 50,
): Promise<FetchAllResult<T>> {
  const rows: T[] = [];

  for (let pageIndex = 0; pageIndex < maxPages; pageIndex += 1) {
    const from = pageIndex * chunk;
    const to = from + chunk - 1;
    const { data, error } = await page(from, to);

    if (error) {
      return { data: rows, error };
    }

    const batch = data ?? [];
    rows.push(...batch);

    if (batch.length < chunk) {
      return { data: rows, error: null };
    }
  }

  console.warn(
    `[fetch-all] Reached the ${maxPages}-page limit (${maxPages * chunk} rows); results may be truncated.`,
  );

  return { data: rows, error: null };
}
