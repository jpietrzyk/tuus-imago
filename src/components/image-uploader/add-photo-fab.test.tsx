import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { AddPhotoFab } from "./add-photo-fab";
import { t } from "@/locales/i18n";

describe("AddPhotoFab", () => {
  it("opens a menu with camera and device options", async () => {
    const user = userEvent.setup();
    render(
      <AddPhotoFab onTakePhoto={vi.fn()} onChooseFromDevice={vi.fn()} />,
    );

    const trigger = screen.getByTestId("add-photo-fab");
    expect(trigger).toBeEnabled();
    expect(screen.queryByTestId("add-photo-camera")).toBeNull();

    await user.click(trigger);

    expect(screen.getByTestId("add-photo-camera")).toHaveTextContent(
      t("uploader.addPhotoCamera"),
    );
    expect(screen.getByTestId("add-photo-from-device")).toHaveTextContent(
      t("uploader.addPhotoFromDevice"),
    );
  });

  it("invokes the camera handler and closes the menu", async () => {
    const user = userEvent.setup();
    const onTakePhoto = vi.fn();
    const onChooseFromDevice = vi.fn();
    render(
      <AddPhotoFab
        onTakePhoto={onTakePhoto}
        onChooseFromDevice={onChooseFromDevice}
      />,
    );

    await user.click(screen.getByTestId("add-photo-fab"));
    await user.click(screen.getByTestId("add-photo-camera"));

    expect(onTakePhoto).toHaveBeenCalledTimes(1);
    expect(onChooseFromDevice).not.toHaveBeenCalled();
    expect(screen.queryByTestId("add-photo-camera")).toBeNull();
  });

  it("invokes the device handler", async () => {
    const user = userEvent.setup();
    const onTakePhoto = vi.fn();
    const onChooseFromDevice = vi.fn();
    render(
      <AddPhotoFab
        onTakePhoto={onTakePhoto}
        onChooseFromDevice={onChooseFromDevice}
      />,
    );

    await user.click(screen.getByTestId("add-photo-fab"));
    await user.click(screen.getByTestId("add-photo-from-device"));

    expect(onChooseFromDevice).toHaveBeenCalledTimes(1);
    expect(onTakePhoto).not.toHaveBeenCalled();
  });

  it("stays disabled and closed when no slot is available", () => {
    render(
      <AddPhotoFab disabled onTakePhoto={vi.fn()} onChooseFromDevice={vi.fn()} />,
    );

    const trigger = screen.getByTestId("add-photo-fab");
    expect(trigger).toBeDisabled();

    fireEvent.click(trigger);

    expect(screen.queryByTestId("add-photo-camera")).toBeNull();
    expect(screen.queryByTestId("add-photo-from-device")).toBeNull();
  });
});
