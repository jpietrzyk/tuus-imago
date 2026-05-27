export type PaintingSize = 40 | 50 | 60 | 80 | 100;

export const PAINTING_SIZE_OPTIONS: {
  size: PaintingSize;
  label: string;
}[] = [
  { size: 40, label: "40 x 40" },
  { size: 50, label: "50 x 50" },
  { size: 60, label: "60 x 60" },
  { size: 80, label: "80 x 80" },
  { size: 100, label: "100 x 100" },
];

export const DEFAULT_PAINTING_SIZE: PaintingSize = 60;

const PAINTING_SIZE_SCALE_MAP: Record<PaintingSize, number> = {
  40: 0.7,
  50: 0.85,
  60: 1.0,
  80: 1.2,
  100: 1.4,
};

export function getPaintingSizeScale(size: PaintingSize): number {
  return PAINTING_SIZE_SCALE_MAP[size];
}
