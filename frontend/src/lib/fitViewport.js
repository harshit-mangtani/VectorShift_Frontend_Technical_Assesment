import { getNodesBounds, getViewportForBounds } from 'reactflow';

/**
 * The canvas runs full-bleed beneath the floating chrome — that is what makes the glass
 * refract — so fitting to the whole pane parks nodes under the header, the node rail and
 * the bottom-right instrument cluster. These insets describe what is actually free.
 *
 * The bottom band is the tallest piece of chrome in that corner (the minimap), which also
 * clears the zoom bar and the bin stacked above it; nothing else reaches the right edge,
 * so that inset is only a margin.
 */
export const CHROME = {
  top: 56, // 56px header
  right: 24,
  bottom: 148, // 120px minimap + its 16px offset
  left: 84, // 60px collapsed node rail + its 16px offset
};

/**
 * Viewport that lands the whole graph inside the free area. Pure, so the arithmetic can
 * be checked without a layout engine. Returns null when there is nothing to frame, or no
 * room to frame it in — the caller falls back to React Flow's own fit.
 */
export const fitViewport = (
  nodes,
  pane,
  { minZoom, maxZoom, padding = 0.12, chrome = CHROME } = {}
) => {
  const width = pane.width - chrome.left - chrome.right;
  const height = pane.height - chrome.top - chrome.bottom;
  if (!nodes.length || width <= 0 || height <= 0) return null;

  const { x, y, zoom } = getViewportForBounds(
    getNodesBounds(nodes),
    width,
    height,
    minZoom,
    maxZoom,
    padding
  );

  // getViewportForBounds frames into a box at the origin; the shift moves that box onto
  // the free area.
  return { x: x + chrome.left, y: y + chrome.top, zoom };
};
