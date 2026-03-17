# Image Uploader Preview Stretching - Regression Notes

## Problem we saw repeatedly

On large screens, preview images could appear stretched horizontally even when the selected proportion was vertical or square.

Symptoms:

- Vertical selected in the proportion dropdown, but preview looked wider than taller.
- Square selected, but preview looked like a horizontal rectangle.
- The issue returned after seemingly small layout changes.

## Why this happened

Two layers had to stay consistent at the same time:

1. Layout layer (slot frame proportions in CSS).
2. Canvas draw layer (how the crop is drawn into measured canvas dimensions).

If either layer drifted:

- A wrong/unstable frame ratio could make canvas measured box wider than expected.
- Drawing crop directly to full canvas destination (`0,0,dstW,dstH`) could stretch the image.

## What fixed it

### 1) Stable frame proportions in slot UI

Main preview slot and side slots now enforce deterministic aspect classes:

- vertical -> `aspect-[2/3]`
- horizontal -> `aspect-[16/9]`
- square/rectangle -> `aspect-square`

This keeps frame geometry stable across breakpoints.

### 2) Anti-stretch guard in canvas rendering

`drawCroppedImageToCanvas` now preserves crop ratio when destination canvas box ratio differs:

- Compute crop aspect ratio vs measured canvas aspect ratio.
- Fit crop into canvas (letterbox if needed).
- Center drawing (`drawX`, `drawY`) instead of stretching to full canvas box.

Result: even if the measured box is temporarily mismatched, image is not deformed.

## Regression tests added

### Frame ratio tests

- `src/components/image-uploader/painting-preview-slot.test.tsx`
  - Asserts vertical frame includes `aspect-[2/3]`.
  - Asserts horizontal frame includes `aspect-[16/9]`.
  - Asserts square frame includes `aspect-square`.

### Canvas anti-stretch tests

- `src/components/image-uploader/preview-canvas-utils.test.ts`
  - Vertical crop in wide canvas: verifies centered letterboxed draw dimensions.
  - Square crop in wide canvas: verifies centered non-stretched draw dimensions.

## Practical guardrails for future changes

- Do not remove aspect classes from preview slot frames without replacing them with an equivalent hard ratio guarantee.
- Do not change draw destination from fitted dimensions back to full-canvas stretch (`dstW`, `dstH`) unless ratio-safe logic remains.
- If adjusting responsive slot sizing, re-run the preview regression tests below.

## Suggested test command

```bash
node ./node_modules/vitest/vitest.mjs --run \
  src/components/image-uploader/preview-canvas-utils.test.ts \
  src/components/image-uploader/painting-preview-slot.test.tsx \
  src/components/image-uploader/side-slot-preview.test.tsx \
  src/components/image-uploader/preview-render-plan.test.ts \
  src/components/image-uploader/uploader-preview-slider.test.tsx
```
