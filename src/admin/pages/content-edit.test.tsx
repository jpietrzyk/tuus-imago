import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";

const mockMutate = vi.fn();
const mockTriggerBuild = vi.fn();

vi.mock("@refinedev/core", () => ({
  useOne: () => ({
    query: { isFetching: false },
    result: {
      id: "c1",
      slug: "about",
      title: "O nas",
      subtitle: "Dowiedz się więcej",
      icon: "Building2",
      menu_section: "company",
      menu_order: 1,
      last_updated: "2025-02-01",
      body: "## Misja",
      lang: "pl",
      is_published: true,
    },
  }),
  useUpdate: () => ({ mutate: mockMutate }),
}));

vi.mock("@/components/markdown-editor", () => ({
  MarkdownEditor: ({
    value,
    onChange,
  }: {
    value: string;
    onChange: (v: string) => void;
  }) => (
    <textarea
      data-testid="body-editor"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

vi.mock("@/admin/lib/trigger-build", () => ({
  triggerBuild: () => mockTriggerBuild(),
}));

import { ContentEditPage } from "./content-edit";

function renderEdit() {
  return render(
    <MemoryRouter initialEntries={["/admin/content/c1/edit"]}>
      <Routes>
        <Route path="/admin/content/:id/edit" element={<ContentEditPage />} />
        <Route path="/admin/content" element={<div>Content List</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ContentEditPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMutate.mockImplementation((_args: unknown, options?: { onSuccess?: () => void }) => {
      options?.onSuccess?.();
    });
  });

  it("loads the content into the form", () => {
    renderEdit();
    expect((screen.getByDisplayValue("O nas") as HTMLInputElement)).toBeInTheDocument();
    expect((screen.getByDisplayValue("Building2") as HTMLInputElement)).toBeInTheDocument();
  });

  it("renders the slug as read-only", () => {
    renderEdit();
    const slugInput = screen.getByDisplayValue("about");
    expect(slugInput).toHaveAttribute("readonly");
  });

  it("saves and then prompts to rebuild", async () => {
    mockTriggerBuild.mockResolvedValue({ ok: true, statusCode: 200 });
    renderEdit();

    await userEvent.click(screen.getByText("Zapisz zmiany"));

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({ resource: "content_pages" }),
        expect.anything(),
      );
    });

    await waitFor(() => {
      expect(screen.getByText("Uruchomić przebudowę witryny?")).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText("Przebuduj teraz"));

    await waitFor(() => {
      expect(mockTriggerBuild).toHaveBeenCalledTimes(1);
    });
    await waitFor(() => {
      expect(screen.getByText(/Przebudowa uruchomiona/)).toBeInTheDocument();
    });
  });

  it("shows an error message when the update fails", async () => {
    mockMutate.mockImplementation((_args: unknown, options?: { onError?: (e: Error) => void }) => {
      options?.onError?.(new Error("Boom"));
    });
    renderEdit();

    await userEvent.click(screen.getByText("Zapisz zmiany"));

    await waitFor(() => {
      expect(screen.getByText("Boom")).toBeInTheDocument();
    });
  });
});
