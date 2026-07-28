# Pipeline Builder — VectorShift Frontend Assessment

A node-based workflow builder: React + React Flow on the front end, FastAPI on the back.
Drag nodes onto the canvas, wire them together, and submit the pipeline to be analysed
for node/edge counts and whether it forms a DAG.

---

## Quickstart

Two terminals.

```bash
# 1 — frontend  →  http://localhost:3000
cd frontend
npm i
npm start
```

```bash
# 2 — backend   →  http://localhost:8000
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

The frontend targets `http://localhost:8000` by default; override with
`REACT_APP_API_URL` if needed.

### Commands

| | |
|---|---|
| `npm start` | dev server |
| `npm run build` | production build |
| `npm test` | frontend tests (watch) |
| `npm run test:ci` | frontend tests once, with coverage |
| `npm run lint` | ESLint |
| `pytest` | backend tests (from `backend/`) |

---

## Using the builder

1. Pick a node from the left library — **drag** it onto the canvas, or **click** it to
   drop one in the centre.
2. Drag from a node's right-hand port to another node's left-hand port to connect them.
3. Edit fields directly on the card.
4. Remove things three ways: press <kbd>Delete</kbd> on a selection, **drag a node onto the
   bin** at the bottom-right, or click the bin to delete the selected node. Both bin routes
   ask for confirmation first; deleting a *connection* doesn't, since it's trivial to redraw.
5. Switch connections between **straight and curved** with the toggle beside the bin. It
   re-routes what's already on the canvas, not just new connections.
6. **Fit view** frames the whole pipeline into the space the floating chrome leaves free,
   rather than under it.
7. **Clear all** in the header empties the canvas, also behind a confirmation.
8. Hit **Submit** to analyse the pipeline.

The bin opens its lid and turns red as a node comes over it, the node shrinks and tilts in
your hand, and on confirm a card-shaped stand-in arcs into the bin as it gulps. All of it is
suppressed under `prefers-reduced-motion`.

A fuller tour, with the reasoning behind each behaviour, is in
[docs/FEATURES.md](docs/FEATURES.md).

---

## How each part was addressed

### Part 1 — Node abstraction

A node type is **one config object**. Nothing else in the app changes when you add one.

```js
// nodes/configs/myNode.config.js
import { Sparkles } from 'lucide-react';

export const myNodeConfig = {
  type: 'myNode',
  label: 'My Node',
  description: 'What it does',
  icon: Sparkles,
  category: 'logic',
  fields: [
    { key: 'mode', type: 'select', label: 'Mode', defaultValue: 'fast',
      options: [{ label: 'Fast', value: 'fast' }, { label: 'Precise', value: 'precise' }] },
  ],
  handles: [
    { type: 'target', id: 'in' },
    { type: 'source', id: 'out' },
  ],
};
```

Add it to the array in [`nodes/registry.js`](frontend/src/nodes/registry.js) and it is
registered with React Flow, listed in the toolbar under its category, coloured by its
accent, draggable, click-to-addable, seeded into `node.data`, and covered by the existing
test suite. That's the whole process — see [docs/NODE_ABSTRACTION.md](docs/NODE_ABSTRACTION.md)
for the full schema.

The second half of the requirement — *applying styles across nodes* — is
[`nodes/core/nodeVariants.js`](frontend/src/nodes/core/nodeVariants.js). One `cva()` call
owns card appearance for every node type; editing it restyles all nine.

**The five new nodes** were chosen for coverage rather than plausibility, since the brief
asks for a demonstration of the abstraction's flexibility:

| Node | What it proves the abstraction can do |
|---|---|
| **Filter** | Two source handles, plus a field that appears only for binary operators (`visibleIf`) |
| **Transform** | Reuses the Text node's `{{variable}}` ports in three lines of config |
| **API Request** | Per-field validation — URL format, JSON parse, numeric bounds |
| **Database** | A field that rewrites the node's own topology (write mode adds a port) |
| **Note** | The degenerate case: no handles, no header, fully custom body |

### Part 2 — Styling

A minimal glassmorphic interface built on a semantic token layer in
[`tailwind.config.js`](frontend/tailwind.config.js). A fixed three-point radial wash
(indigo / violet / cyan over a near-white canvas) gives the glass something to refract;
chrome surfaces — header, node rail, dialogs, minimap, and the bottom-right instrument row
(bin, connection-shape toggle, vertical zoom bar) — share one `.glass` recipe of
translucent white, a light border and `backdrop-blur-xl`. Accent is an indigo→violet
gradient, one hue per node category, radii 12–16px.

**Node cards deliberately skip `backdrop-blur`.** Each blurred layer is its own compositing
pass, and a canvas can hold hundreds of nodes; they use translucent white with a soft
category tint behind the header instead. Real glass is reserved for the handful of chrome
surfaces, where the cost is bounded.

Motion: cards pop in on mount, the rail expands on two axes, dialogs scale in, result tiles
stagger, the Submit button runs a three-dot loader, and buttons depress on `:active`.
Everything is suppressed under `prefers-reduced-motion`.

The node library is a **floating rail** — detached from the window edge, rounded, shadowed.
Collapsed it shows icons only; it expands in both axes on hover, on keyboard focus, or when
pinned with the chevron. Width animates directly; the search field and group headings expand
via a `grid-rows-[0fr] → [1fr]` transition, so the rail's height animates smoothly rather
than snapping. Labels stay mounted while collapsed so every item keeps its accessible name.

**Responsive** down to ~320px: the rail caps its expanded width to the viewport, the minimap
hides below `sm`, the wordmark drops below `xs`, and "Clear all" becomes icon-only. On touch
a chevron toggle replaces hover, and click-to-add replaces dragging — HTML drag-and-drop
doesn't fire on touch, so tapping is the only way to add a node on a phone. Dragging a node
*on the canvas* does work on touch, because React Flow drives that with pointer events
rather than the HTML5 drag API — which is also why the bin hit-tests pointer coordinates in
`onNodeDrag` instead of listening for a drop event.

*Visual direction is inspired by VectorShift's public product aesthetic. All markup,
styling, icons, and layout are original; no proprietary assets are used.*

### Part 3 — Text node

- The single-line input is now a textarea that **grows in both dimensions** — height from
  `scrollHeight`, width from the widest line measured on a shared canvas context — clamped
  to sane bounds, scrolling beyond the maximum rather than growing forever.
- `{{variable}}` names create left-hand target handles, in first-appearance order, deduped,
  validated as real JavaScript identifiers (reserved words rejected). Invalid names produce
  an inline warning instead of vanishing silently.
- **Handle IDs are positional (`in-0`, `in-1`, …), not derived from the variable name.**
  An ID built from the name turns every rename into a remove-and-recreate, which drops the
  connection and leaves React Flow with an unmeasured port. Renaming now changes only the
  label; the wire survives.
- The parser is a standalone, independently tested utility:
  [`lib/parseVariables.js`](frontend/src/lib/parseVariables.js).

### Part 4 — Backend integration

`POST /pipelines/parse` returns exactly `{num_nodes, num_edges, is_dag}`. Cycle detection
is **iterative Kahn's algorithm** (O(V+E)) — iterative rather than recursive DFS so a deep
pipeline can't exhaust the stack. [`submit.js`](frontend/src/submit.js) posts the graph and
opens a result dialog.

**On "create an alert":** this is implemented as a styled, focus-trapped dialog rather than
`window.alert`, because the brief asks for the values to be shown "in a user-friendly
manner". It is the required alert — three stat tiles plus a plain-English explanation of
what the DAG result means.

---

## Architecture

```
Drag / click  →  useAddNode  →  Zustand store  →  React Flow  →  Submit
                      │                                            │
              initialNodeData()                              flushPending()
              (defaults from config)                    then POST /pipelines/parse
```

- **`nodes/registry.js`** — the single source of truth. Toolbar, `nodeTypes`, minimap
  colours, and tests all derive from it.
- **`nodes/core/createNode.js`** — turns a config into a memoized React Flow component.
- **`store.js`** — Zustand. All node data is immutable; editing one node leaves every other
  node's object identity intact.

| Doc | Covers |
|---|---|
| [docs/FEATURES.md](docs/FEATURES.md) | Every behaviour in the app and the reasoning behind it |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Layout, build setup, data flow, store contract, the API contract |
| [docs/NODE_ABSTRACTION.md](docs/NODE_ABSTRACTION.md) | The full config schema and how to add a node type |
| [docs/PERFORMANCE.md](docs/PERFORMANCE.md) | What was optimised, what was measured, what was rejected |

---

## Bugs found in the starter code

Fixed along the way, listed because they're easy to miss:

| Where | Problem |
|---|---|
| `package.json` | **`zustand` was a phantom dependency** — imported by `store.js` but never declared. It resolved only because `reactflow` hoists it. A clean install with a different resolution would break the app. Now declared explicitly. |
| `inputNode.js`, `outputNode.js`, `textNode.js` | Field values lived only in `useState` and never reached `node.data`, so the submitted pipeline would have shipped without anything the user typed. |
| `store.js` | `updateNodeField` **mutated** `node.data` and returned the same object reference, so React Flow could skip re-renders. |
| `store.js` | `getNodeID` read `get().nodeIDs`, which was never initialised in the store. |
| `ui.js` | `width: '100wv'` — invalid CSS unit, silently ignored. |
| `ui.js` | `reactFlowInstance.project()` is deprecated. Replaced with `screenToFlowPosition`, which required React Flow ≥ 11.10 — the lockfile pinned 11.8.3 even though `package.json` already allowed `^11.8.3`, so the lock was refreshed to 11.11.4. |
| `ui.js` | `onDrop`'s dependency array omitted `getNodeID` and `addNode`. |
| `llmNode.js` | Handle offsets hand-tuned as `100/3` / `200/3` per node. Now distributed automatically. |
| `main.py` | A `GET` endpoint declaring a `Form(...)` body — could not work as written. |

Two more that neither the brief nor the starter code hints at, both in React Flow itself:

**It does not delete edges when a handle disappears.** Deleting `{{input}}` from a Text
node left a live edge pointing at a port that no longer existed, inflating `num_edges` and
potentially reporting a false cycle. `pruneEdges` in the store fixes it, and it's covered
by tests.

**It measures port positions with `getBoundingClientRect()` — which includes CSS
transforms — but only re-measures on a `ResizeObserver`, which a transform never fires.**
A port read while its card is mid-animation is therefore recorded in the wrong place, by a
fraction of the card's own width, and nothing ever corrects it. Since every card runs a
220 ms entrance scale, this made arrowhead spacing differ per node type and shift as a
Text node grew — the error is proportional to card width, and the Text node is the only
one whose width varies. Fixed by re-measuring once a card's transform settles
([`useMeasureAfterTransform`](frontend/src/hooks/useMeasureAfterTransform.js)) and by
making port hover a `box-shadow` halo rather than a `scale()`.

---

## Tests

170 tests: 149 frontend (Jest + React Testing Library), 21 backend (pytest).

```
cd frontend && npm run test:ci     # 149 passed, 14 suites
cd backend  && pytest -q           # 21 passed
```

Highlights:

- **`nodes/registry.test.js`** loops over every registered config and asserts each one
  renders, exposes exactly its declared handle IDs, seeds its fields into `node.data`, and
  gives every visible field a real label. One test protecting all nine node types — and the
  evidence that the abstraction is real rather than asserted.
- **`nodes/textNode.test.js`** covers variable handles appearing, deduping, being rejected
  when invalid, and — the important one — disappearing *along with their edges*.
- **`App.test.js`** types into a field and submits with no intervening delay, proving the
  debounce is flushed and the request carries the value just typed, not the previous one.
- **`nodes/textNode.test.js`** also pins the rename guarantee directly: renaming a variable
  — longer, shorter, or one of several — must leave the handle IDs and the edge list byte
  for byte identical.
- **`lib/fitViewport.test.js`** projects the graph's bounding box through the computed
  viewport and asserts it clears every inset, rather than asserting the arithmetic it just
  performed.
- **`hooks/useMeasureAfterTransform.test.js`** covers the re-measure firing on
  `animationend`, ignoring transitions that can't move a port, and — the one that matters —
  refusing to measure a card that is still transformed.
- **`backend/test_dag.py`** covers empty, single, linear, branching, merging, diamond,
  self-loop, 2-cycle, long cycle, a cycle in one of two disconnected components, duplicate
  edges, edges referencing unknown nodes, and a 10,000-node graph.

---

## Performance

See [docs/PERFORMANCE.md](docs/PERFORMANCE.md). Summary:

- Keystrokes stay in local state and commit to the store on a debounce, so typing no longer
  re-renders the whole graph — then get flushed before submit so nothing is lost.
- Node components are memoized on `data`/`selected` only. **Position is excluded** — React
  Flow moves nodes with a CSS transform, so bodies don't need to re-render during a drag.
- The Submit button reads state via `useStore.getState()` rather than subscribing, so it
  doesn't re-render on every drag frame.
- `nodeTypes` is built once at module scope; variable parsing and text measurement are cached.

Production bundle: **110.6 kB JS + 8.0 kB CSS**, gzipped.

---

## Known limitations

- No persistence — reloading clears the canvas.
- No undo/redo.
- Light theme only. Tokens are semantic, so dark mode is a token swap, but it isn't wired up.
- Field validation is advisory: an invalid URL shows an error but doesn't block submission.
- Responsive to ~320px, but a node canvas is inherently cramped on a phone; laptop and
  desktop are the intended targets.
- `npm i` reports ~66 audit advisories. Every one traces to `react-scripts@5.0.1`'s
  build-time dependency tree — Create React App is unmaintained, so its transitives are
  frozen (e.g. the high-severity `postcss@7.0.39` comes via `resolve-url-loader` ←
  `react-scripts`; the project's own postcss is 8.5.23). None of it reaches the production
  bundle, and no runtime dependency is affected. `npm audit fix --force` "resolves" them by
  installing the placeholder `react-scripts@0.0.0`, which destroys the build — the only
  real remedy is migrating off CRA, which would break the `npm i` / `npm start` workflow
  the assessment specifies.

## With another day

Pipeline save/load to `localStorage`, undo/redo via a Zustand middleware, per-node
execution status, and a Playwright end-to-end pass over the drag → connect → submit flow.
