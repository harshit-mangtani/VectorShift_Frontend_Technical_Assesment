import { getNodesBounds, getViewportForBounds } from 'reactflow';

export const CHROME = {
  top: 0,
  right: 24,
  bottom: 120,
  left: 54,
};

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

  return { x: x + chrome.left, y: y + chrome.top, zoom };
};
