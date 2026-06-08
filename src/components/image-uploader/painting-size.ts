export type PaintingSizeIndex = 0 | 1 | 2 | 3 | 4 | 5;

export type PaintingShape = "square" | "rectangular";

export const DEFAULT_PAINTING_SIZE_INDEX: PaintingSizeIndex = 2;

export interface PaintingSizeOption {
  key: PaintingSizeIndex;
  label: string;
  widthCm: number;
  heightCm: number;
}

const SQUARE_OPTIONS: PaintingSizeOption[] = [
  { key: 0, label: "40 x 40", widthCm: 40, heightCm: 40 },
  { key: 1, label: "50 x 50", widthCm: 50, heightCm: 50 },
  { key: 2, label: "60 x 60", widthCm: 60, heightCm: 60 },
  { key: 3, label: "80 x 80", widthCm: 80, heightCm: 80 },
  { key: 4, label: "100 x 100", widthCm: 100, heightCm: 100 },
  { key: 5, label: "120 x 120", widthCm: 120, heightCm: 120 },
];

const RECTANGULAR_OPTIONS: PaintingSizeOption[] = [
  { key: 0, label: "60 x 40", widthCm: 60, heightCm: 40 },
  { key: 1, label: "75 x 50", widthCm: 75, heightCm: 50 },
  { key: 2, label: "90 x 60", widthCm: 90, heightCm: 60 },
  { key: 3, label: "120 x 80", widthCm: 120, heightCm: 80 },
  { key: 4, label: "150 x 100", widthCm: 150, heightCm: 100 },
];

const SIZE_SCALE_MAP: Record<PaintingSizeIndex, number> = {
  0: 0.667,
  1: 0.833,
  2: 1.0,
  3: 1.333,
  4: 1.667,
  5: 2.0,
};

export const ALL_PAINTING_SIZE_INDICES: PaintingSizeIndex[] = [0, 1, 2, 3, 4, 5];

export function getPaintingSizeOptions(
  shape: PaintingShape,
): PaintingSizeOption[] {
  return shape === "square" ? SQUARE_OPTIONS : RECTANGULAR_OPTIONS;
}

export function getPaintingSizeScale(index: PaintingSizeIndex): number {
  return SIZE_SCALE_MAP[index];
}
