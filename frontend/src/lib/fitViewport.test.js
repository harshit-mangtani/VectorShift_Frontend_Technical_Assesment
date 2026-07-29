import { CHROME, fitViewport } from './fitViewport';

const PANE = { width: 1200, height: 800 };
const ZOOM = { minZoom: 0.2, maxZoom: 2 };

const node = (x, y) => ({ id: `${x}-${y}`, position: { x, y }, width: 200, height: 120 });
const graph = [node(0, 0), node(600, 400)];

// Where the graph's bounding box lands on screen under a given viewport.
const projected = ({ x, y, zoom }, nodes) => {
  const xs = nodes.map((n) => n.position.x);
  const ys = nodes.map((n) => n.position.y);
  const right = Math.max(...nodes.map((n) => n.position.x + n.width));
  const bottom = Math.max(...nodes.map((n) => n.position.y + n.height));
  return {
    left: Math.min(...xs) * zoom + x,
    top: Math.min(...ys) * zoom + y,
    right: right * zoom + x,
    bottom: bottom * zoom + y,
  };
};

describe('fitting into the free area', () => {
  it('keeps the whole graph clear of every piece of chrome', () => {
    const box = projected(fitViewport(graph, PANE, ZOOM), graph);

    expect(box.left).toBeGreaterThanOrEqual(CHROME.left);
    expect(box.top).toBeGreaterThanOrEqual(CHROME.top);
    expect(box.right).toBeLessThanOrEqual(PANE.width - CHROME.right);
    expect(box.bottom).toBeLessThanOrEqual(PANE.height - CHROME.bottom);
  });

  it('centres the graph in the free area rather than in the pane', () => {
    const box = projected(fitViewport(graph, PANE, ZOOM), graph);
    const centre = (box.left + box.right) / 2;

    expect(centre).toBeCloseTo(
      CHROME.left + (PANE.width - CHROME.left - CHROME.right) / 2,
      6
    );
  });

  it('respects the zoom limits', () => {
    const tiny = fitViewport([node(0, 0)], PANE, ZOOM);
    expect(tiny.zoom).toBeLessThanOrEqual(ZOOM.maxZoom);

    const sprawling = fitViewport([node(0, 0), node(40000, 40000)], PANE, ZOOM);
    expect(sprawling.zoom).toBeGreaterThanOrEqual(ZOOM.minZoom);
  });

  it('defers to React Flow when there is nothing to frame', () => {
    expect(fitViewport([], PANE, ZOOM)).toBeNull();
  });

  // Derived from CHROME rather than hard-coded, so retuning the insets can't quietly
  // turn this into a test of nothing.
  it('defers to React Flow when the insets leave no room', () => {
    const flat = { width: 1200, height: CHROME.top + CHROME.bottom };
    const narrow = { width: CHROME.left + CHROME.right, height: 700 };

    expect(fitViewport(graph, narrow, ZOOM)).toBeNull();
    expect(fitViewport(graph, flat, ZOOM)).toBeNull();
  });
});
