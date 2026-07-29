import { CHROME, fitViewport } from './fitViewport';

const PANE = { width: 1200, height: 800 };
const ZOOM = { minZoom: 0.2, maxZoom: 2 };

const node = (x, y) => ({ id: `${x}-${y}`, position: { x, y }, width: 200, height: 120 });
const graph = [node(0, 0), node(600, 400)];

const projected = ({ x, y, zoom }, nodes) => ({
  left: Math.min(...nodes.map((n) => n.position.x)) * zoom + x,
  top: Math.min(...nodes.map((n) => n.position.y)) * zoom + y,
  right: Math.max(...nodes.map((n) => n.position.x + n.width)) * zoom + x,
  bottom: Math.max(...nodes.map((n) => n.position.y + n.height)) * zoom + y,
});

it('keeps the whole graph clear of every piece of chrome', () => {
  const box = projected(fitViewport(graph, PANE, ZOOM), graph);

  expect(box.left).toBeGreaterThanOrEqual(CHROME.left);
  expect(box.top).toBeGreaterThanOrEqual(CHROME.top);
  expect(box.right).toBeLessThanOrEqual(PANE.width - CHROME.right);
  expect(box.bottom).toBeLessThanOrEqual(PANE.height - CHROME.bottom);
});

it('respects the zoom limits', () => {
  expect(fitViewport([node(0, 0)], PANE, ZOOM).zoom).toBeLessThanOrEqual(ZOOM.maxZoom);
  expect(
    fitViewport([node(0, 0), node(40000, 40000)], PANE, ZOOM).zoom
  ).toBeGreaterThanOrEqual(ZOOM.minZoom);
});

// Derived from CHROME so retuning the insets cannot quietly make this a test of nothing.
it('defers to React Flow with nothing to frame, or no room to frame it', () => {
  expect(fitViewport([], PANE, ZOOM)).toBeNull();
  expect(
    fitViewport(graph, { width: 1200, height: CHROME.top + CHROME.bottom }, ZOOM)
  ).toBeNull();
  expect(
    fitViewport(graph, { width: CHROME.left + CHROME.right, height: 700 }, ZOOM)
  ).toBeNull();
});
