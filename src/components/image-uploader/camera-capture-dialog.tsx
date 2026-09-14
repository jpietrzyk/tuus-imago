import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { t } from "@/locales/i18n";

/**
 * In-app camera capture.
 *
 * The hidden `<input type="file" capture>` hands off to the OS camera app,
 * which backgrounds the tab and lets mobile browsers discard/reload the page —
 * losing the in-flight photo and tripping the "interrupted capture" fallback.
 * Streaming the camera in-page keeps the document alive, so the captured photo
 * is converted to a `File` in JS and never depends on surviving a reload.
 *
 * If `getUserMedia` is unavailable or denied, the caller can fall back to the
 * device picker.
 */

const CAPTURE_FILE_BASENAME = "camera-photo";
const CAPTURE_MIME_TYPE = "image/jpeg";
const CAPTURE_QUALITY = 0.92;

type CameraStatus = "starting" | "ready" | "error";

export interface CameraCaptureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCapture: (file: File) => void;
  onUseDevicePicker: () => void;
}

function cameraApiAvailable(): boolean {
  return (
    typeof navigator !== "undefined" &&
    typeof navigator.mediaDevices?.getUserMedia === "function"
  );
}

function canvasToJpegBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => {
    if (typeof canvas.toBlob !== "function") {
      resolve(null);
      return;
    }

    canvas.toBlob((blob) => resolve(blob), CAPTURE_MIME_TYPE, CAPTURE_QUALITY);
  });
}

interface CameraSessionProps {
  onCapture: (file: File) => void;
  onUseDevicePicker: () => void;
  onCancel: () => void;
}

/**
 * Mounted while the dialog content is open, so each open starts a fresh stream
 * and unmounting always releases the camera.
 */
function CameraSession({
  onCapture,
  onUseDevicePicker,
  onCancel,
}: CameraSessionProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<CameraStatus>(() =>
    cameraApiAvailable() ? "starting" : "error",
  );
  // `video.videoWidth` stays 0 until the stream's metadata loads, so the
  // shutter must stay disabled until then or an early tap captures nothing.
  const [hasFrame, setHasFrame] = useState(false);
  const [capturing, setCapturing] = useState(false);
  // Refs guard against synchronous double taps and late `toBlob` callbacks;
  // state alone updates asynchronously and would let a second tap through.
  const capturingRef = useRef(false);
  const cancelledRef = useRef(false);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    const video = videoRef.current;
    if (video) {
      video.srcObject = null;
    }
  }, []);

  useEffect(() => {
    if (!cameraApiAvailable()) {
      return;
    }

    // Reset for the (StrictMode) remount that follows this cleanup.
    cancelledRef.current = false;
    let cancelled = false;

    navigator.mediaDevices
      .getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          if (typeof video.play === "function") {
            try {
              const playResult = video.play();
              if (playResult && typeof playResult.catch === "function") {
                playResult.catch(() => {
                  // Autoplay can be rejected; the stream still renders frames.
                });
              }
            } catch {
              // Some environments throw synchronously from play().
            }
          }
        }
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) {
          setStatus("error");
        }
      });

    return () => {
      cancelled = true;
      cancelledRef.current = true;
      stopStream();
    };
  }, [stopStream]);

  const handleCapture = useCallback(() => {
    if (capturingRef.current) {
      return;
    }

    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    capturingRef.current = true;
    setCapturing(true);

    void canvasToJpegBlob(canvas).then((blob) => {
      // The dialog may have been closed/cancelled while encoding.
      if (cancelledRef.current) {
        return;
      }

      capturingRef.current = false;
      setCapturing(false);

      if (!blob) {
        return;
      }

      stopStream();
      const capturedAt = Date.now();
      onCapture(
        new File([blob], `${CAPTURE_FILE_BASENAME}-${capturedAt}.jpg`, {
          type: CAPTURE_MIME_TYPE,
          lastModified: capturedAt,
        }),
      );
    });
  }, [onCapture, stopStream]);

  const handleUseDevicePicker = useCallback(() => {
    stopStream();
    onUseDevicePicker();
  }, [onUseDevicePicker, stopStream]);

  return (
    <>
      {status === "error" ? (
        <p
          className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"
          data-testid="camera-capture-error"
        >
          {t("uploader.cameraUnavailable")}
        </p>
      ) : (
        <div className="relative overflow-hidden rounded-lg bg-black">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            onLoadedMetadata={() => setHasFrame(true)}
            data-testid="camera-capture-video"
            className="h-auto max-h-[60vh] w-full object-contain"
          />
          {status === "starting" && (
            <div className="absolute inset-0 flex items-center justify-center text-xs text-white/80">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
              {t("uploader.cameraStarting")}
            </div>
          )}
        </div>
      )}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          {t("uploader.cancel")}
        </Button>
        {status === "error" ? (
          <Button
            type="button"
            onClick={handleUseDevicePicker}
            data-testid="camera-use-device-picker"
          >
            {t("uploader.cameraUseDevicePicker")}
          </Button>
        ) : (
          <Button
            type="button"
              onClick={handleCapture}
              disabled={status !== "ready" || !hasFrame || capturing}
              data-testid="camera-capture-shutter"
          >
            <Camera aria-hidden />
            {t("uploader.cameraCapture")}
          </Button>
        )}
      </DialogFooter>
    </>
  );
}

export function CameraCaptureDialog({
  open,
  onOpenChange,
  onCapture,
  onUseDevicePicker,
}: CameraCaptureDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className="max-w-[min(32rem,calc(100vw-2rem))]"
        data-testid="camera-capture-dialog"
      >
        <DialogHeader>
          <DialogTitle>{t("uploader.cameraTitle")}</DialogTitle>
          <DialogDescription>
            {t("uploader.cameraDescription")}
          </DialogDescription>
        </DialogHeader>
        <CameraSession
          onCapture={onCapture}
          onUseDevicePicker={onUseDevicePicker}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

export default CameraCaptureDialog;
