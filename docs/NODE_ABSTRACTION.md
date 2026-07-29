# Node abstraction

## Adding a node

Two steps.

**1.** Write a config in `frontend/src/nodes/configs/`:

```js
import { Sparkles } from 'lucide-react';

export const scoreConfig = {
  type: 'score',
  label: 'Score',
  description: 'Rate an input 0–1',
  icon: Sparkles,
  category: 'logic',
  fields: [
    { key: 'threshold', type: 'number', label: 'Threshold', required: true,
      help: 'Rows below this are dropped.',
      defaultValue: 0.5, numeric: { min: 0, max: 1, step: 0.05 } },
  ],
  handles: [
    { type: 'target', id: 'input' },
    { type: 'source', id: 'score' },
  ],
  outputs: [{ key: 'score', type: 'Decimal', description: 'Confidence, 0–1' }],
};
```

**2.** Add it to the array in `nodes/registry.js`.

That's it. It's now registered with React Flow, grouped in the toolbar, draggable and
click-to-addable, seeded into `node.data`, rendered with labelled accessible controls,
badged with its field types, given its id pill and outputs panel, and covered by
`registry.test.js`.

---

## Schema

### `NodeConfig`

| Key | Type | Notes |
|---|---|---|
| `type` | `string` | React Flow node-type key. Unique. |
| `label` | `string` | Card title and toolbar entry. |
| `description` | `string?` | Sub-title in the header; tooltip in the toolbar. |
| `icon` | `Component` | Any `lucide-react` icon. |
| `category` | `'io' \| 'llm' \| 'logic' \| 'data' \| 'utility'` | Toolbar grouping and ordering. |
| `fields` | `FieldConfig[]?` | Auto-rendered in order. |
| `handles` | `HandleConfig[] \| (data) => HandleConfig[]` | A function makes ports dynamic. |
| `outputs` | `OutputConfig[] \| (data) => OutputConfig[]` | Renders the outputs panel. |
| `size` | `object \| (data) => object` | `{ width, minHeight }`. |
| `render` | `Component?` | Escape hatch — replaces the body entirely. |
| `defaultData` | `object?` | Seeds `node.data` for keys no field owns. |
| `bare` | `boolean?` | Drops the header. |
| `className` | `string?` | Extra classes on the card. |

### `FieldConfig`

| Key | Type | Notes |
|---|---|---|
| `key` | `string` | Where the value lives in `node.data`. Omitted by `action`. |
| `type` | `'text' \| 'textarea' \| 'number' \| 'password' \| 'select' \| 'checkbox' \| 'toggle' \| 'action'` | |
| `label` | `string` | A real `<label>`, so it's queryable and accessible. |
| `defaultValue` | `any \| (id) => any` | The function form is for id-derived defaults. |
| `required` | `boolean?` | Red `*`, `aria-required`, and a `Required` error while blank. |
| `help` | `string?` | `ⓘ` tooltip, wired to the control with `aria-describedby`. |
| `badge` | `string \| null?` | Type pill. Defaults from `type`; `null` opts out. |
| `options` | `{label, value}[]` | `select` only. |
| `numeric` | `{min, max, step}` | `number` only. |
| `rows` | `number` | `textarea` only. |
| `labels` | `[off, on]` | `toggle` only. Names both states either side of the switch. |
| `run` | `(data, set) => void` | `action` only. `set(key, value)` is bound to this node. |
| `icon` / `tone` | `Component` / `'danger'` | `action` only. |
| `visibleIf` | `(data) => boolean` | Conditional display. |
| `validate` | `(value) => string \| null` | Return a message to show an inline error. |

Tickboxes and switches carry no badge — the control already says it's a yes/no.

### `HandleConfig`

| Key | Type | Notes |
|---|---|---|
| `type` | `'source' \| 'target'` | |
| `id` | `string` | Suffix only — the real id is `` `${nodeId}-${id}` ``. |
| `position` | `'left' \| 'right'?` | Defaults: targets left, sources right. |
| `label` | `string?` | Rendered next to the port. |

Ports are distributed down their side automatically. No config computes an offset.

### `OutputConfig`

| Key | Type | Notes |
|---|---|---|
| `key` | `string` | Field name as a downstream node would reference it. |
| `type` | `string` | Free text — `Text`, `Integer`, `List<JSON>`. Rendered as a badge. |
| `description` | `string?` | One line under the name. |
| `advanced` | `boolean?` | Starts collapsed behind a disclosure. |

`outputs` is declaration only — nothing executes a pipeline here. It states the contract so
it can be read off the canvas instead of inferred.

---

## The decisions that matter

### `handles` can be a function of `data`

This is what keeps Part 3 from being a special case. The Text node's variable ports are just
a config:

```js
handles: (data) => [
  ...parseVariables(data.text).variables.map((name, index) => ({
    type: 'target', id: `in-${index}`, label: name,
  })),
  { type: 'source', id: 'output' },
],
```

**The id is a positional slot, deliberately not the label.** An id built from the variable
name makes every rename a remove-and-recreate: React Flow tears the port down, any edge into
it points at nothing, and the replacement is unmeasured. Positional ids mean a rename changes
`label` and nothing else. `textNode.test.js` covers renaming one of several variables,
renaming to something shorter, and deleting one outright.

`createNode` watches the resolved handle-id list and the card's declared size — a card that
resizes moves its right-hand ports just as surely as adding one does. When either changes it
calls `useUpdateNodeInternals`, then `pruneEdges` to drop edges pointing at ports that no
longer exist.

There's a third measurement trigger that isn't about config at all: see
[ARCHITECTURE.md § Port measurement](ARCHITECTURE.md#port-measurement).

### `outputs` can be too

Same trick, applied to what a node emits. **JSON Parse** derives both from one field, so a
single comma-separated list drives the ports you wire out of *and* the contract shown beside
them:

```js
handles: (data) => [
  { type: 'target', id: 'json' },
  ...keysOf(data.keys).map((key, i) => ({ type: 'source', id: `out-${i}`, label: key })),
],
outputs: (data) => keysOf(data.keys).map((key) => ({ key, type: 'Any' })),
```

An outputs panel changes the card's width, which moves the right-hand ports — so the
resolved output count is part of what `createNode` watches before re-measuring.

### Actions are narrow on purpose

`run(data, set)` gets the node's data and a setter **bound to that node**. A config that
could reach anywhere would make node behaviour unreviewable, and there's no pipeline runtime
here for it to reach into anyway. JSON Parse's *Sort fields A–Z* rewrites the field its ports
derive from; the ports re-order with it.

### `render` is an escape hatch

An abstraction you can't escape is a straitjacket. `render` replaces the body while keeping
the card, ports and styling. **Note** uses it with `bare: true` to end up with no handles and
no header — proof a node doesn't have to look like the others to belong.

---

## The dangling-edge problem

React Flow does **not** remove edges when a handle disappears. Delete `{{input}}` from a Text
node and the edge that fed it survives, pointing at a port that no longer exists. It still
renders, still serialises, still counts toward `num_edges`, and can make an acyclic pipeline
report as cyclic.

`createNode` handles it centrally: whenever a node's handle set changes, `pruneEdges` drops
edges whose `sourceHandle`/`targetHandle` is no longer valid for that node. Every node with
dynamic ports gets the fix for free.
