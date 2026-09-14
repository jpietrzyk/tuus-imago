import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react";

import { CameraCaptureDialog } from "./camera-capture-dialog";

vi.mock("@/locales/i18n", () => ({
  t: (key: string) => key,
}));

interface FakeStream {
  stream: MediaStream;
  stop: ReturnType<typeof vi.fn>;
}

function createStream(): FakeStream {
  const stop = vi.fn();
  const track = {
    stop,
    getCapabilities: () => ({}),
    getSettings: () => ({}),
    applyConstraints: vi.fn().mockResolvedValue(undefined),
  };
  const stream = {
    getTracks: () => [track],
    getVideoTracks: () => [track],
  } as unknown as MediaStream;

  return { stream, stop };
}

function videoInputs(count: number): MediaDeviceInfo[] {
  return Array.from(
    { length: count },
    () => ({ kind: "videoinput" }) as MediaDeviceInfo,
  );
}

function installMediaDevices(
  getUserMedia: (constraints: MediaStreamConstraints) => Promise<MediaStream>,
  devices: MediaDeviceInfo[] = [],
) {
  Object.defineProperty(navigator, "mediaDevices", {
    configurable: true,
    value: {
      getUserMedia: vi.fn(getUserMedia),
      enumerateDevices: vi.fn().mockResolvedValue(devices),
    },
  });
}

function setVideoDimensions(
  video: HTMLVideoElement,
  width: number,
  height: number,
) {
  Object.defineProperty(video, "videoWidth", { configurable: true, value: width });
  Object.defineProperty(video, "videoHeight", {
    configurable: true,
    value: height,
  });
}

function renderDialog(
  overrides: Partial<React.ComponentProps<typeof CameraCaptureDialog>> = {},
) {
  const onCapture = vi.fn();
  const onOpenChange = vi.fn();
  const onUseDevicePicker = vi.fn();

  const result = render(
    <CameraCaptureDialog
      open
      onOpenChange={onOpenChange}
      onCapture={onCapture}
      onUseDevicePicker={onUseDevicePicker}
      {...overrides}
    />,
  );

  return { onCapture, onOpenChange, onUseDevicePicker, ...result };
}

describe("CameraCaptureDialog", () => {
  beforeEach(() => {
    vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
    HTMLCanvasElement.prototype.toBlob = function (
      this: HTMLCanvasElement,
      callback: BlobCallback,
    ) {
      callback(new Blob(["frame"], { type: "image/jpeg" }));
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
    // getUserMedia is defined per-test; remove it so other suites see the
    // default jsdom environment.
    Reflect.deleteProperty(navigator, "mediaDevices");
  });

  it("requests the rear camera and enables the shutter only once a frame is loaded", async () => {
    const { stream } = createStream();
    const getUserMedia = vi.fn().mockResolvedValue(stream);
    installMediaDevices(getUserMedia);

    renderDialog();

    const video = (await screen.findByTestId(
      "camera-capture-video",
    )) as HTMLVideoElement;
    expect(getUserMedia).toHaveBeenCalledWith({
      video: {
        facingMode: { ideal: "environment" },
        width: { ideal: 4096 },
        height: { ideal: 4096 },
      },
      audio: false,
    });

    const shutter = await screen.findByTestId("camera-capture-shutter");
    // No metadata yet: an early tap must stay disabled.
    expect(shutter).toBeDisabled();

    fireEvent.loadedMetadata(video);
    await waitFor(() => expect(shutter).toBeEnabled());
  });

  it("converts the captured frame into a JPEG File", async () => {
    const { stream, stop } = createStream();
    installMediaDevices(vi.fn().mockResolvedValue(stream));

    const { onCapture } = renderDialog();

    const video = (await screen.findByTestId(
      "camera-capture-video",
    )) as HTMLVideoElement;
    setVideoDimensions(video, 1280, 720);
    fireEvent.loadedMetadata(video);

    const shutter = await screen.findByTestId("camera-capture-shutter");
    await waitFor(() => expect(shutter).toBeEnabled());

    fireEvent.click(shutter);

    await waitFor(() => expect(onCapture).toHaveBeenCalledTimes(1));

    const captured = onCapture.mock.calls[0][0] as File;
    expect(captured).toBeInstanceOf(File);
    expect(captured.type).toBe("image/jpeg");
    expect(captured.name).toMatch(/^camera-photo-\d+\.jpg$/);
    expect(stop).toHaveBeenCalled();
  });

  it("ignores extra taps while a capture is in flight", async () => {
    const { stream } = createStream();
    installMediaDevices(vi.fn().mockResolvedValue(stream));

    const { onCapture } = renderDialog();

    const video = (await screen.findByTestId(
      "camera-capture-video",
    )) as HTMLVideoElement;
    setVideoDimensions(video, 1280, 720);
    fireEvent.loadedMetadata(video);

    const shutter = await screen.findByTestId("camera-capture-shutter");
    await waitFor(() => expect(shutter).toBeEnabled());

    fireEvent.click(shutter);
    fireEvent.click(shutter);
    fireEvent.click(shutter);

    await waitFor(() => expect(onCapture).toHaveBeenCalledTimes(1));

    // Let any stray callbacks flush before asserting the count stays at one.
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(onCapture).toHaveBeenCalledTimes(1);
  });

  it("shows the unavailable state and falls back to the device picker when the camera errors", async () => {
    installMediaDevices(vi.fn().mockRejectedValue(new Error("denied")));

    const { onUseDevicePicker } = renderDialog();

    await screen.findByTestId("camera-capture-error");

    fireEvent.click(screen.getByTestId("camera-use-device-picker"));

    expect(onUseDevicePicker).toHaveBeenCalledTimes(1);
  });

  it("shows the unavailable state when getUserMedia is unsupported", async () => {
    renderDialog();

    await screen.findByTestId("camera-capture-error");
    expect(screen.queryByTestId("camera-capture-shutter")).toBeNull();
  });

  it("stops the stream when the dialog closes", async () => {
    const { stream, stop } = createStream();
    installMediaDevices(vi.fn().mockResolvedValue(stream));

    const { rerender } = renderDialog();

    await screen.findByTestId("camera-capture-video");
    await waitFor(() => expect(stop).not.toHaveBeenCalled());

    rerender(
      <CameraCaptureDialog
        open={false}
        onOpenChange={vi.fn()}
        onCapture={vi.fn()}
        onUseDevicePicker={vi.fn()}
      />,
    );

    await waitFor(() => expect(stop).toHaveBeenCalled());
  });

  it("offers a switch to the front camera when more than one camera exists", async () => {
    const rear = createStream();
    const front = createStream();
    const getUserMedia = vi
      .fn()
      .mockResolvedValueOnce(rear.stream)
      .mockResolvedValueOnce(front.stream);
    installMediaDevices(getUserMedia, videoInputs(2));

    const { onCapture } = renderDialog();

    await screen.findByTestId("camera-capture-video");
    const switchButton = await screen.findByTestId("camera-switch");

    fireEvent.click(switchButton);

    await waitFor(() => expect(getUserMedia).toHaveBeenCalledTimes(2));
    expect(getUserMedia).toHaveBeenLastCalledWith(
      expect.objectContaining({
        video: expect.objectContaining({ facingMode: { ideal: "user" } }),
      }),
    );
    expect(rear.stop).toHaveBeenCalled();
    expect(onCapture).not.toHaveBeenCalled();
  });

  it("hides the camera switch when only one camera exists", async () => {
    installMediaDevices(vi.fn().mockResolvedValue(createStream().stream), videoInputs(1));

    renderDialog();

    await screen.findByTestId("camera-capture-video");
    await waitFor(() =>
      expect(screen.queryByTestId("camera-switch")).toBeNull(),
    );
  });

  it("restores the rear camera when switching cameras fails", async () => {
    const rear = createStream();
    const fallbackRear = createStream();
    const getUserMedia = vi
      .fn()
      .mockResolvedValueOnce(rear.stream)
      .mockRejectedValueOnce(new Error("no front camera"))
      .mockResolvedValueOnce(fallbackRear.stream);
    installMediaDevices(getUserMedia, videoInputs(2));

    renderDialog();

    await screen.findByTestId("camera-capture-video");
    fireEvent.click(await screen.findByTestId("camera-switch"));

    await waitFor(() => expect(getUserMedia).toHaveBeenCalledTimes(3));
    expect(getUserMedia).toHaveBeenLastCalledWith(
      expect.objectContaining({
        video: expect.objectContaining({ facingMode: { ideal: "environment" } }),
      }),
    );
    // It recovers to a usable camera instead of showing the error state.
    expect(await screen.findByTestId("camera-capture-shutter")).toBeInTheDocument();
    expect(screen.queryByTestId("camera-capture-error")).toBeNull();
  });
});
