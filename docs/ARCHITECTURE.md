# Architecture

## Layout

```
frontend/
  craco.config.js             switches postcss to file mode (see below)
  postcss.config.js           tailwind + autoprefixer
  tailwind.config.js          design tokens
  src/
    index.js                  React Flow's stylesheet first, then ours — order matters
    App.js                    canvas, rail, the two floating actions
    store.js                  Zustand — nodes, edges, ids
    toolbar.js                node library, reads the registry
    draggableNode.js          library entry (drag + click to add)
    ui.js                     the React Flow canvas
    submit.js                 Part 4
    components/               ResultDialog, ConfirmDialog, EdgeShapeToggle,
                              ClearAllButton, LoadingDots
    edges/                    edgeTypes map, TrimmedEdge, CurvedEdge, EdgeDeleteButton
    hooks/                    useAddNode, useDebouncedField, useAutosizeHeight,
                              useMeasureAfterTransform
    lib/                      parseVariables, measureText, edgeShape, fitViewport,
                              api, pendingCommits
    nodes/
      registry.js             single source of truth
      core/                   BaseNode, createNode, Field + its controls, NodeHandle,
                              OutputsPanel, nodeVariants
      configs/                one file per node type

backend/
  main.py    app + routes
  models.py  Pydantic schemas
  dag.py     cycle detection
```

## Build setup

CRA 5 inlines its own PostCSS options, so a standalone `postcss.config.js` is ignored —
which silently produces a stylesheet where `@tailwind` and `@apply` survive into the output.
CRACO's `style.postcss.plugins` array reports success but doesn't reliably reach the loader
either.

What works: `craco.config.js` sets `style.postcss.mode = 'file'`, which strips CRA's inlined
options so `postcss-loader` reads `postcss.config.js` normally.

`npm start`, `npm test` and `npm run build` are unchanged from the brief; only the runner
behind them is CRACO.

## Stylesheet order

`index.js` imports `reactflow/dist/style.css` **before** `./index.css`. Webpack emits CSS in
first-require order, and most of our canvas rules target React Flow's own selectors at the
same specificity — so whichever sheet lands last wins the tie. Importing React Flow's inside
`ui.js` put it *after* ours, which silently reverted the handles, the zoom bar and the edge
colour to its defaults. Don't move these.

## Data flow

```
library click / canvas drop
        ↓  useAddNode — builds the id, seeds data from the config's defaults
   Zustand store — the only source of truth
        ↓  React Flow — nodeTypes from the registry, built once
  field edit → local state → (debounce 100–150ms) → store
        ↓  Submit — flushPending(), read via getState(), POST
```

## Store contract

| Action | Guarantee |
|---|---|
| `getNodeID(type)` | Lowest number not on the canvas, per type. Derived from `nodes`, not a counter, so deleting `llm-1` frees it. Safe because `removeNode` takes the node's edges too. Callers must add the node before asking again. |
| `addNode(node)` | New array; existing node references preserved. |
| `updateNodeField(id, key, value)` | New node **and** new `data` for the target only. Everything else keeps its identity, which is what makes `React.memo` work. |
| `pruneEdges(id, validHandleIds)` | Drops edges bound to handles that no longer exist. Same array identity when nothing changes. |
| `removeNode(id)` | Node plus every edge attached to it. |
| `removeEdge(id)` | One connection. Unconfirmed by design. |
| `clearAll()` | Empties both. |
| `requestDelete(id \| null)` | Marks a node for deletion. The card's ✕ and the Delete key both write here, so one dialog serves both. |
| `toggleEdgeShape()` | Flips `edgeShape`. A view preference — edges carry no type of their own. |

Node components subscribe to their own slice, never the whole `nodes` array.
`applyNodeChanges` returns a new array on every mousemove during a drag; a broad
subscription would re-render at frame rate.

## Port measurement

React Flow caches each port's offset from `getBoundingClientRect()` — which folds in every
CSS transform on the card — and only re-reads it when a **ResizeObserver** fires. A transform
never fires one.

So a port measured mid-animation is recorded in the wrong place, by a fraction of the card's
own width, and nothing afterwards corrects it. Two rules follow:

- Anything that transforms a card must trigger a re-measure once it settles —
  `useMeasureAfterTransform`, attached in `BaseNode`.
- Nothing that is a port, or an ancestor of one, should use `transform` for a hover or state
  effect where `box-shadow` would do.

## Frontend ↔ backend

**Request** — `POST /pipelines/parse`. React Flow's render state (`position`, `width`,
`selected`, `dragging`…) is stripped so the contract is explicit:

```json
{
  "nodes": [{ "id": "text-1", "type": "text", "data": { "text": "hi" } }],
  "edges": [{ "id": "e1", "source": "customInput-1", "target": "text-1",
              "sourceHandle": "customInput-1-value", "targetHandle": "text-1-in-0" }]
}
```

**Response** — exactly three keys, no envelope:

```json
{ "num_nodes": 1, "num_edges": 1, "is_dag": true }
```

The backend models set `extra="ignore"`, so unstripped React Flow nodes still work — the
stripping is for clarity and payload size, not to avoid a 422.

## Cycle detection

Kahn's, iterative, O(V+E). Nodes with in-degree 0 drain into a queue; anything never drained
has an unresolvable dependency, which only a cycle causes. Iterative rather than recursive
DFS so deep pipelines can't hit Python's recursion limit. Edges referencing unknown ids are
ignored rather than treated as errors; a self-loop is a cycle.
