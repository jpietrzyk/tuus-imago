import { vi } from "vitest";

type CreateClientMock = {
  mockReturnValue: (value: unknown) => unknown;
};

export function readBody<T>(response: { body: string }) {
  return JSON.parse(response.body) as T;
}

export function mockSupabaseClient(
  createClientMock: CreateClientMock,
  tables: Record<string, unknown>,
) {
  const from = vi.fn((table: string) => {
    if (!(table in tables)) {
      throw new Error(`Unexpected table: ${table}`);
    }

    return tables[table] as never;
  });

  createClientMock.mockReturnValue({ from } as never);

  return { from };
}

export function createInsertSelectSingle<T>(result: T) {
  const single = vi.fn().mockResolvedValue(result);
  const select = vi.fn().mockReturnValue({ single });
  const insert = vi.fn().mockReturnValue({ select });

  return { insert, select, single };
}

export function createSelectEqMaybeSingle<T>(result: T) {
  const maybeSingle = vi.fn().mockResolvedValue(result);
  const eq = vi.fn().mockReturnValue({ maybeSingle });
  const select = vi.fn().mockReturnValue({ eq });

  return { select, eq, maybeSingle };
}

export function createDeleteEq(result: unknown = { error: null }) {
  const eq = vi.fn().mockResolvedValue(result);
  const remove = vi.fn().mockReturnValue({ eq });

  return { delete: remove, eq };
}

export function createUpdateEq(result: unknown = { error: null }) {
  const eq = vi.fn().mockResolvedValue(result);
  const update = vi.fn().mockReturnValue({ eq });

  return { update, eq };
}

export function createUpdateEqSelectSingle<T>(result: T) {
  const single = vi.fn().mockResolvedValue(result);
  const select = vi.fn().mockReturnValue({ single });
  const eq = vi.fn().mockReturnValue({ select });
  const update = vi.fn().mockReturnValue({ eq });

  return { update, eq, select, single };
}

export function createSelectOrderLimit<T>(result: T) {
  const limit = vi.fn().mockResolvedValue(result);
  const order = vi.fn().mockReturnValue({ limit });
  const select = vi.fn().mockReturnValue({ order });

  return { select, order, limit };
}

export function createSelectInOrder<T>(result: T) {
  const order = vi.fn().mockResolvedValue(result);
  const within = vi.fn().mockReturnValue({ order });
  const select = vi.fn().mockReturnValue({ in: within });

  return { select, in: within, order };
}
