export async function readJpegExifResolution(
  file: File,
): Promise<{ xResolution: number; yResolution: number; resolutionUnit?: number } | null> {
  try {
    const exifr = await import("exifr");
    const parsed = await exifr.default.parse(file, {
      tiff: true,
    });

    if (!parsed) {
      return null;
    }

    const xRes = parsed.XResolution;
    const yRes = parsed.YResolution;
    const resUnit = parsed.ResolutionUnit;

    if (typeof xRes !== "number" || typeof yRes !== "number") {
      return null;
    }

    return {
      xResolution: xRes,
      yResolution: yRes,
      resolutionUnit: resUnit,
    };
  } catch {
    return null;
  }
}
