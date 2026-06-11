export function loadImageDimensions(
  file: File,
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    // Use an object URL instead of FileReader.readAsDataURL to avoid reading
    // and base64-encoding the entire file on the main thread just to read
    // its dimensions. The object URL only references the blob and is revoked
    // once naturalWidth/naturalHeight are available.
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    const cleanup = () => {
      URL.revokeObjectURL(objectUrl);
    };

    img.onload = () => {
      const dimensions = {
        width: img.naturalWidth,
        height: img.naturalHeight,
      };
      cleanup();
      resolve(dimensions);
    };
    img.onerror = () => {
      cleanup();
      reject(new Error("Failed to load image"));
    };

    img.src = objectUrl;
  });
}
