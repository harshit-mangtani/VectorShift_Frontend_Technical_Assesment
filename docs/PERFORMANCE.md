# Performance

## Measured

Production build, gzipped:

| Asset | Size |
|---|---|
| `main.js` | 110.6 kB |
| `main.css` | 8.0 kB |

React Flow accounts for the bulk of the JS. Tailwind's content scanning keeps CSS at
8 kB for a nine-node design system — preflight plus only the utilities actually used.

**Not measured here:** React DevTools Profiler traces. Profiling a browser session wasn't
possible in the environment this was built in, so no before/after render timings are
claimed. The reproduction steps are below — they're the scenarios the changes target.

```bash
npm run build            # profile the production build, not `npm start` —
                         # dev builds are unoptimised and StrictMode double-renders
```

- **Typing** — 20 characters into a Text node on a ~40-node graph; record commits.
- **Dragging** — drag one node for ~2s on the same graph; record dropped frames.
- **Scale** — 300 nodes / 300 edges; pan and zoom; record FPS.

## What was done, and why

### Typing

The starter code committed to the store on every keystroke while node components
subscribed to the whole `nodes` array, so each character re-rendered every node on the
canvas.

- Field edits stay in local state and commit on a trailing debounce (100–150ms).
- Node components are `React.memo`'d with a comparator on `data`/`selected`.
- `updateNodeField` replaces only the edited node; every other node keeps its object
  identity, which is what makes the memo actually hold.
- `parseVariables` is memoised per input string; text is measured on one shared canvas
  context instead of by DOM reflow.

The debounce introduces a hazard worth naming: clicking Submit immediately after typing
would otherwise send the *previous* value. `flushPending()` forces outstanding commits
before the payload is read, and `App.test.js` covers it.

### Dragging

`applyNodeChanges` returns a new `nodes` array on every mousemove — roughly 60 times a
second for the duration of a drag. Two consequences, both handled:

- **Nothing subscribes to the whole array** except the canvas itself. Node components read
  their own slice.
- **The memo comparator ignores `position`.** React Flow moves nodes with a CSS transform
  on the wrapper element, so a node's body has no reason to re-render as it travels.
  Comparing position would re-render the dragged node's entire subtree every frame.
- **The Submit button reads state with `useStore.getState()`** inside its click handler
  rather than subscribing. It needs the graph once, at click time; a subscription would
  re-render it on every drag frame.

### Canvas

- `nodeTypes` is built once at module scope. Rebuilding it per render makes React Flow
  discard and recreate its internals.
- Edges are **not** animated by default. Each animated edge runs a CSS animation; at scale
  they dominate the frame budget.
- `useUpdateNodeInternals` fires only when the resolved handle-ID list or the card's
  declared size actually changes, plus once when a card transform settles — not on every
  keystroke in a Text node. Because Text-node port IDs are positional rather than derived
  from the variable name, renaming a variable changes neither, so it costs nothing.
- The connection shape is applied at render time, but an edge that already carries the
  right type is passed through by identity, so toggling doesn't invalidate the graph.
- Autosize writes are `requestAnimationFrame`-throttled.

## Considered and rejected

| | Why not |
|---|---|
| Normalising the store to a `Map` | `nodes.map()` is O(n) per update, but debouncing already caps that at ~7 updates/sec. Normalisation adds complexity at every React Flow integration point for no gain at this scale. |
| `onlyRenderVisibleElements` | A real option and one prop away, but it should be enabled on evidence, not by default — it has trade-offs during fast panning. Left off pending the Scale measurement above. |
| Redux | Zustand already fits. |
| Route-level code splitting / lazy MiniMap | Single-route app; the split would cost a waterfall and save nothing meaningful against a 110 kB bundle. |
| Windowing the node library | Nine items. |
