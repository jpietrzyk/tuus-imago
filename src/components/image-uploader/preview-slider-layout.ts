/**
 * Vertical position of the painting preview contents: the slider caps its
 * content height by reserving this much space at the bottom (so the preview
 * bottom edge stays clear of the footer and background image elements there
 * stay visible) and top-aligns the contents, which scales the previews down
 * slightly at the largest painting size.
 *
 * Lives in its own module (not the slider component file) so the component
 * file keeps component-only exports and stays React Fast Refresh-safe:
 * mixed exports force a full page reload on every edit in development.
 */
export const PREVIEW_SLIDER_BOTTOM_RESERVE_PX = 96;
