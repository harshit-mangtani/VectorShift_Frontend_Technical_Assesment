# Architecture

## Layout

```
frontend/
  craco.config.js             switches postcss to file mode (see Build setup)
  postcss.config.js           tailwind + autoprefixer
  tailwind.config.js          design tokens
  src/
    App.js                    shell: header, toolbar, canvas
    store.js                  Zustand — nodes, edges, IDs
    toolbar.js                node library, reads the registry
    draggableNode.js          library entry (drag + click to add)
    ui.js                     the React Flow canvas
    submit.js                 Part 4 submit flow
    components/
      ResultDialog.js         the required alert
    hooks/
      useAddNode.js           one creation path for drag and click
      useDebouncedField.js    local-first editing, debounced commit
      useAutosizeHeight.js    textarea height
    lib/
      parseVariables.js       {{variable}} extraction
      measureText.js          cached canvas text measurement
      api.js                  payload shaping + fetch
      pendingCommits.js       flush registry for debounced edits
    nodes/
      registry.js             single source of truth
      core/                   BaseNode, Field, NodeHandle, createNode, nodeVariants
      configs/                one file per node type

backend/
  main.py                     app + routes
  models.py                   Pydantic schemas
  dag.py                      cycle detection
```

## Build setup

Create React App 5 inlines its own PostCSS options, so a standalone `postcss.config.js`
is ignored — which silently produces a stylesheet where `@tailwind` and `@apply` survive
into the output and no utilities are generated. CRACO's `style.postcss.plugins` array
reports success but does not reliably reach the loader either.

The arrangement that works: `craco.config.js` sets `style.postcss.mode = 'file'`, which
strips CRA's inlined options so `postcss-loader` falls back to reading `postcss.config.js`
normally. Tailwind is configured there.

`npm start`, `npm test`, and `npm run build` are unchanged from the assessment's
instructions; only the runner behind them is CRACO.

## Data flow

```
library click / canvas drop
        ↓
   useAddNode          ← builds the ID and seeds data from the config's defaults
        ↓
  Zustand store        ← the only source of truth for nodes and edges
        ↓
   React Flow          ← nodeTypes comes from the registry, built once
        ↓
  field edit → local state → (debounce 100–150ms) → store
        ↓
     Submit            ← flushPending(), then read via getState(), then POST
```

## Store contract

| Action | Guarantee |
|---|---|
| `getNodeID(type)` | Monotonic per type. Never reuses a number after deletion. |
| `addNode(node)` | New array; existing node references preserved. |
| `updateNodeField(id, key, value)` | Returns a new node **and** a new `data` object for the target only. Every other node keeps its identity, which is what makes `React.memo` effective. |
| `pruneEdges(id, validHandleIds)` | Removes edges bound to handles that no longer exist on that node. No-ops (same array identity) when nothing changes. |
| `onNodesChange` / `onEdgesChange` / `onConnect` | Standard React Flow handlers. |

Node components subscribe to their own slice, never to the whole `nodes` array.
`applyNodeChanges` produces a new array on every mousemove during a drag; a broad
subscription would re-render at frame rate.

## Frontend ↔ backend contract

**Request** — `POST /pipelines/parse`. React Flow's render state (`position`, `width`,
`selected`, `dragging`, …) is stripped so the contract is explicit:

```json
{
  "nodes": [{ "id": "text-1", "type": "text", "data": { "text": "hi" } }],
  "edges": [{ "id": "e1", "source": "customInput-1", "target": "text-1",
              "sourceHandle": "customInput-1-value", "targetHandle": "text-1-input" }]
}
```

**Response** — exactly three keys, no envelope:

```json
{ "num_nodes": 1, "num_edges": 1, "is_dag": true }
```

The backend models set `extra="ignore"`, so sending unstripped React Flow nodes still
works — the stripping is for clarity and payload size, not to avoid a 422.

## Cycle detection

Kahn's algorithm, iterative, O(V+E). Nodes with in-degree 0 are drained into a queue; if
any node is never drained it has an unresolvable dependency, which only a cycle can cause.
Iterative rather than recursive DFS so deep pipelines can't hit Python's recursion limit.
Edges referencing unknown node IDs are ignored rather than treated as errors; a self-loop
is a cycle by definition.
