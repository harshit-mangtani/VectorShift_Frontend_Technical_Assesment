# Pipeline Builder — VectorShift Frontend Assessment

A node-based workflow builder. React + React Flow on the front, FastAPI on the back. Drag
nodes onto the canvas, wire them up, hit Submit, and the backend tells you how many nodes
and edges you have and whether it's a DAG.

## Running it

Two terminals.

```bash
cd frontend && npm i && npm start     # → localhost:3000
cd backend  && pip install -r requirements.txt && uvicorn main:app --reload
```

The frontend points at `http://localhost:8000`; override with `REACT_APP_API_URL`.

| | |
|---|---|
| `npm start` / `npm run build` | dev server / production build |
| `npm test` / `npm run test:ci` | tests, watch / once with coverage |
| `npm run lint` | ESLint |
| `pytest` | backend tests, from `backend/` |

## Using it

Pick a node from the rail on the left — drag it, or click to drop one in the middle. Drag
right port → left port to connect. Edit fields on the card.

- **Delete a node**: the ✕ on its card, or select it and press <kbd>Delete</kbd>. Both ask
  first. **Delete a connection**: the ✕ at its midpoint, or select and <kbd>Delete</kbd> —
  no confirmation, it's one drag to redraw.
- **Connection shape** toggles straight ↔ curved, and re-routes what's already there.
- **Fit view** frames the graph into the space the floating chrome leaves free.
- **Lock** freezes dragging, connecting and selecting in one switch.
- **Clear all** (top right) empties the canvas, behind a confirmation.

More in [docs/FEATURES.md](docs/FEATURES.md).

---

## The four parts

### 1 — Node abstraction

A node type is **one config object**. Nothing else changes when you add one.

```js
export const scoreConfig = {
  type: 'score',
  label: 'Score',
  description: 'Rate an input 0–1',
  icon: Sparkles,
  category: 'logic',
  fields: [
    { key: 'threshold', type: 'number', label: 'Threshold', required: true,
      help: 'Rows below this are dropped.', defaultValue: 0.5 },
  ],
  handles: [{ type: 'target', id: 'in' }, { type: 'source', id: 'out' }],
  outputs: [{ key: 'score', type: 'Decimal', description: 'Confidence, 0–1' }],
};
```

Add it to the array in [`nodes/registry.js`](frontend/src/nodes/registry.js) and it's
registered with React Flow, grouped in the toolbar, draggable, click-to-addable, seeded into
`node.data`, and covered by the existing tests. Full schema in
[docs/NODE_ABSTRACTION.md](docs/NODE_ABSTRACTION.md).

The *apply styles across nodes* half is
[`nodes/core/nodeVariants.js`](frontend/src/nodes/core/nodeVariants.js) — one `cva()` call
owns every card.

**The five new nodes** were picked for coverage, not plausibility. Each buys something the
others don't:

| Node | What it proves |
|---|---|
| **Filter** | Two source handles, plus a field that only shows for binary operators |
| **API Request** | Validation across three field types, plus `required` and `help` |
| **Webhook** | Source-only — no target handles at all, and the layout copes |
| **JSON Parse** | Ports *and* declared outputs both derived from one field's value |
| **Note** | The degenerate case: no handles, no header, fully custom body |

Transform and Database nodes existed at one point and were cut: Transform restated the Text
node's `{{variable}}` trick, and Database's select-driven topology is the narrow case of
what JSON Parse already shows. Duplicating a capability adds surface, not evidence.

### 2 — Styling

**Flat, dense and light**, on a semantic token layer in
[`tailwind.config.js`](frontend/tailwind.config.js). Opaque white cards on a pale grey
dotted canvas, hairline `#E7E9F2` borders, small radii — 8px on cards and the rail, 12px on
buttons and canvas instruments, 16px on dialogs — and two soft shadows: `card` at rest,
`lift` on hover and selection. Type is small and tight:
13px titles, 11px labels, monospace for ids and output fields.

**One accent**, indigo `#6366F1` — ports, connections, badges, the submit button, and the
same hue at 5% behind a card's title band. An earlier pass gave each category its own colour;
five hues across a dense canvas is noise, not information, since the icon already says what a
node is. Category now drives grouping and ordering only. The one place colour carries meaning
is connections: grey while you're dragging one out, indigo once it exists.

Cards are fully opaque; only the four surfaces that float *over* the graph — the node rail,
dialogs, the minimap and the instrument row — blur what's behind them, so the pipeline stays
visible underneath.

**No header bar.** The canvas is the product, so the two global actions float in one corner
and the canvas instruments sit in the other.

**Density over decoration.** A card states more than its inputs: the node's **id** (what a
`{{reference}}` resolves against), a **✕**, **type badges**, **required** markers, **help**
tooltips, and — when the config declares `outputs` — a panel naming every field it emits.

**Responsive** to ~320px. The rail caps its width, the minimap hides below `sm`, "Clear all"
goes icon-only, and a chevron replaces hover on touch. Dragging nodes on the canvas still
works on touch because React Flow uses pointer events, not the HTML5 drag API.

*Visual direction is drawn from a VectorShift product demo video on YouTube — the flat
cards, the tinted title band, the id pill, the outputs panel and the type badges all follow
what the product does. All markup, styling, icons and layout are original.*

### 3 — Text node

- The input is a textarea that **grows in both dimensions** — height from `scrollHeight`,
  width from the widest line measured on a shared canvas context — clamped, then scrolls.
- `{{variable}}` names become left-hand ports, in first-appearance order, deduped, validated
  as real JS identifiers (reserved words rejected). Invalid names get an inline warning
  rather than vanishing.
- **Port ids are positional (`in-0`, `in-1`), not the variable name.** An id built from the
  name makes every rename a remove-and-recreate, which drops the connection and leaves React
  Flow with an unmeasured port. Renaming now only changes the label.
- The parser is standalone and separately tested:
  [`lib/parseVariables.js`](frontend/src/lib/parseVariables.js).

### 4 — Backend

`POST /pipelines/parse` returns exactly `{num_nodes, num_edges, is_dag}`. Cycle detection is
**iterative Kahn's** (O(V+E)) — iterative so a deep pipeline can't blow the stack.
[`submit.js`](frontend/src/submit.js) posts the graph and opens the result.

**On "create an alert":** it's a styled, focus-trapped dialog rather than `window.alert`,
because the brief asks for the values "in a user-friendly manner". Three stat tiles and a
plain-English reading of the DAG result. The canvas is sealed behind a scrim while the
request is in flight — the graph is read once, at click time, so letting it be edited
mid-flight would answer a question about a pipeline that no longer exists.

---

## Performance

- Keystrokes stay in local state and commit on a debounce, so typing doesn't re-render the
  graph — then get flushed before submit so nothing is lost.
- Node components are memoized on `data`/`selected` only. **Position is excluded** — React
  Flow moves nodes with a CSS transform, so bodies needn't re-render during a drag.
- Submit reads state via `useStore.getState()` rather than subscribing, so it doesn't
  re-render on every drag frame.
- `nodeTypes` and `edgeTypes` are built once at module scope; variable parsing and text
  measurement are cached.
- `updateNodeField` replaces only the edited node, so every other node keeps its identity
  and the memo actually holds.

Production bundle: **113.4 kB JS + 7.9 kB CSS**, gzipped.

## Tests

120: 106 frontend (Jest + RTL), 14 backend (pytest).

```
cd frontend && npm run test:ci     # 106 passed, 15 suites
cd backend  && pytest -q           # 14 passed
```

Worth knowing:

- **`registry.test.js`** loops every registered config and asserts it renders, exposes its
  declared handle ids, seeds its fields, and labels every visible control. One test covering
  all nine node types — and the evidence the abstraction is real rather than claimed.
- **`textNode.test.js`** covers variable ports appearing, deduping, being rejected when
  invalid, disappearing *with their edges* — and renaming leaving the handle ids and edge
  list byte-for-byte identical.
- **`App.test.js`** types into a field and submits with no delay, proving the debounce is
  flushed and the request carries what was just typed.
- **`fitViewport.test.js`** projects the graph's bounding box through the computed viewport
  and checks it clears every inset, rather than re-asserting the arithmetic. Its "no room to
  frame" case derives from `CHROME`, so retuning the insets can't quietly make it a test of
  nothing.
- **`test_dag.py`** covers empty, diamond, self-loop, long cycle, a cycle in one of two
  disconnected components, duplicate edges, edges referencing unknown nodes, and a
  10,000-node graph.

Deliberately not tested: anything that would only exercise React Flow. `TrimmedEdge`'s
geometry tests went when `GAP` became `0` — they had quietly reduced to asserting that
`getSmoothStepPath` ends where you tell it to.

## Docs

| | |
|---|---|
| [docs/FEATURES.md](docs/FEATURES.md) | What everything does, and why |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Layout, build setup, store contract, API contract |
| [docs/NODE_ABSTRACTION.md](docs/NODE_ABSTRACTION.md) | Config schema, and how to add a node |

## Known limitations

- No persistence, no undo/redo. Reloading clears the canvas.
- Light theme only. Tokens are semantic, so dark mode is a token swap, but it isn't wired.
- Field validation is advisory — an invalid URL warns but doesn't block submission.
- Nothing executes a pipeline. `outputs` declares the data contract; it doesn't run it.
- `npm i` reports ~66 audit advisories. Every one traces to `react-scripts@5.0.1`'s
  build-time tree — CRA is unmaintained, so its transitives are frozen. None reach the
  production bundle. `npm audit fix --force` "fixes" them by installing
  `react-scripts@0.0.0`, which destroys the build; the only real remedy is migrating off
  CRA, which would break the `npm i` / `npm start` workflow the brief specifies.
