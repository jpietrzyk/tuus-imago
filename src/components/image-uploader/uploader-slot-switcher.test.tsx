import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import UploaderSlotSwitcher from "./uploader-slot-switcher";
import type { SelectedImageItem } from "./image-uploader";

const createItem = (name: string): SelectedImageItem => ({
  file: new File([name], `${name}.jpg`, { type: "image/jpeg" }),
  previewUrl: `blob:${name}`,
  metadata: null,
  displayImageProportion: "horizontal",
  autoSelectOptimalPending: false,
});

describe("UploaderSlotSwitcher", () => {
  it("renders one dot button for each slot", () => {
    const slots = [createItem("a"), createItem("b"), null];

    render(
      <UploaderSlotSwitcher
        slots={slots}
        activeSlotIndex={0}
        onSelectSlot={vi.fn()}
      />,
    );

    expect(screen.getByTestId("uploader-slot-dots")).toBeInTheDocument();
    expect(screen.getByTestId("uploader-slot-dot-0")).toBeInTheDocument();
    expect(screen.getByTestId("uploader-slot-dot-1")).toBeInTheDocument();
    expect(screen.getByTestId("uploader-slot-dot-2")).toBeInTheDocument();
  });

  it("marks the active slot dot as aria-pressed", () => {
    const slots = [createItem("a"), createItem("b"), createItem("c")];

    render(
      <UploaderSlotSwitcher
        slots={slots}
        activeSlotIndex={1}
        onSelectSlot={vi.fn()}
      />,
    );

    expect(screen.getByTestId("uploader-slot-dot-0")).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(screen.getByTestId("uploader-slot-dot-1")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByTestId("uploader-slot-dot-2")).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("calls onSelectSlot with the correct index when a dot is clicked", () => {
    const slots = [createItem("a"), createItem("b"), createItem("c")];
    const onSelectSlot = vi.fn();

    render(
      <UploaderSlotSwitcher
        slots={slots}
        activeSlotIndex={0}
        onSelectSlot={onSelectSlot}
      />,
    );

    fireEvent.click(screen.getByTestId("uploader-slot-dot-2"));

    expect(onSelectSlot).toHaveBeenCalledWith(2);
  });
});
