# Node abstraction

## Adding a node

Two steps, no exceptions.

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
  outputs: [
    { key: 'score', type: 'Decimal', description: 'Confidence, 0–1' },
  ],
};
```

**2.** Add it to the array in `nodes/registry.js`.

That is the entire process. The node is now registered with React Flow, grouped into the
toolbar under its category, coloured by its accent, draggable and click-to-addable, seeded
into `node.data` with its defaults, rendered with labelled and accessible controls, badged
with its field types, given its identifier pill and outputs panel, and covered by
`registry.test.js`.

---

## Schema

### `NodeConfig`

| Key | Type | Notes |
|---|---|---|
| `type` | `string` | React Flow node-type key. Must be unique. |
| `label` | `string` | Card title and toolbar entry. |
| `description` | `string?` | Sub-title in the header; tooltip in the toolbar. |
| `icon` | `Component` | Any `lucide-react` icon. |
| `category` | `'io' \| 'llm' \| 'logic' \| 'data' \| 'utility'` | Drives accent colour, toolbar grouping, minimap colour. |
| `fields` | `FieldConfig[]?` | Auto-rendered in order. |
| `handles` | `HandleConfig[] \| (data) => HandleConfig[]` | A function makes ports dynamic. |
| `outputs` | `OutputConfig[] \| (data) => OutputConfig[]` | Renders the outputs panel. A function makes it track data. |
| `size` | `object \| (data) => object` | `{ width, minHeight }`. A function makes the card resize with content. |
| `render` | `Component?` | Escape hatch — replaces the auto-rendered body entirely. |
| `defaultData` | `object?` | Seeds `node.data` for keys not owned by a field. |
| `bare` | `boolean?` | Drops the header and category rail. |
| `className` | `string?` | Extra classes on the card. |

### `FieldConfig`

| Key | Type | Notes |
|---|---|---|
| `key` | `string` | Where the value lives in `node.data`. Omitted by `action`, which owns no value. |
| `type` | `'text' \| 'textarea' \| 'number' \| 'password' \| 'select' \| 'checkbox' \| 'toggle' \| 'action'` | |
| `label` | `string` | Rendered as a real `<label>`, so it's queryable and accessible. |
| `defaultValue` | `any \| (id) => any` | The function form is for ID-derived defaults like `input_1`. |
| `options` | `{label, value}[]` | `select` only. |
| `numeric` | `{min, max, step}` | `number` only. |
| `labels` | `[off, on]` | `toggle` only. Names both states either side of the switch. |
| `run` | `(data, set) => void` | `action` only. `set(key, value)` is bound to this node. |
| `icon` | `Component` | `action` only. |
| `tone` | `'danger'?` | `action` only. |
| `rows` | `number` | `textarea` only. |
| `required` | `boolean?` | Red `*`, `aria-required`, and a `Required` error while blank. |
| `help` | `string?` | `ⓘ` tooltip, wired to the control with `aria-describedby`. |
| `badge` | `string \| null?` | Type pill. Defaults from `type`; `null` opts out. |
| `visibleIf` | `(data) => boolean` | Conditional display. |
| `validate` | `(value) => string \| null` | Return a message to show an inline error. |

### `HandleConfig`

| Key | Type | Notes |
|---|---|---|
| `type` | `'source' \| 'target'` | |
| `id` | `string` | Suffix only — the real ID is `` `${nodeId}-${id}` ``. |
| `position` | `'left' \| 'right'?` | Defaults: targets left, sources right. |
| `label` | `string?` | Rendered next to the port. |

Ports are distributed evenly down their side automatically. No config ever computes an offset.

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

## The design decisions that matter

### `handles` can be a function of `data`

This is what keeps Part 3 from being a special case. The Text node's variable ports are
just a config:

```js
handles: (data) => [
  ...parseVariables(data.text).variables.map((name, index) => ({
    type: 'target', id: `in-${index}`, label: name,
  })),
  { type: 'source', id: 'output' },
],
```

**The ID is a positional slot, deliberately independent of the label.** An ID built from
the variable name would make every rename a remove-and-recreate: React Flow tears the port
down, any edge into it is left pointing at nothing, and the replacement port is unmeasured
until the next observation. Keeping the ID positional means a rename changes `label` and
nothing else — the connection is untouched and no re-measure is needed. Both the Text and
Transform nodes work this way, and `textNode.test.js` covers renaming one of several
variables, renaming to a shorter name, and deleting one entirely.

Because the capability lives in the core rather than in one component, **Transform** picks
up the same behaviour in three lines, and **Database** uses it for something different —
switching to write mode adds a `records` port:

```js
handles: (data) =>
  data.mode === 'write'
    ? [target('query'), target('records'), source('written')]
    : [target('query'), source('rows')],
```

`createNode` watches the resolved handle-ID list, and the card's declared size alongside
it — a card that resizes moves its right-hand ports just as surely as adding one does.
When either changes it calls `useUpdateNodeInternals` so React Flow re-measures, then
calls `pruneEdges` to delete any edge pointing at a port that no longer exists — see below.

Measurement has a third trigger that isn't about config at all: see
[ARCHITECTURE.md § Port measurement](ARCHITECTURE.md#port-measurement).

### `outputs` is a function of `data` too

The same trick, applied to what a node emits rather than what it accepts. **JSON Parse**
derives both from one field, so a single comma-separated list drives the ports you wire out
of *and* the contract shown beside them:

```js
handles: (data) => [
  { type: 'target', id: 'json' },
  ...keysOf(data.keys).map((key, index) => ({ type: 'source', id: `out-${index}`, label: key })),
],
outputs: (data) => keysOf(data.keys).map((key) => ({ key, type: 'Any', description: `Value at ${key}` })),
```

**Database** does the narrower version: read mode emits `rows`, write mode emits `written`.

An outputs panel changes the card's width, which moves the right-hand ports — so the
resolved output count is part of what `createNode` watches before asking React Flow to
re-measure.

### `render` is an escape hatch

An abstraction that can't be escaped becomes a straitjacket. `render` replaces the body
while keeping the card, ports, and styling. The **Note** node uses it together with
`bare: true` to end up with no handles and no header at all — proof that a node doesn't
have to look like the others to belong to the system.

---

## The dangling-edge problem

React Flow does **not** remove edges when a handle disappears. Delete `{{input}}` from a
Text node and the edge that fed it survives, pointing at a port that no longer exists. It
still renders, still serialises, still counts toward `num_edges`, and can make an acyclic
pipeline report as cyclic.

`createNode` handles this centrally: whenever a node's handle set changes, `pruneEdges`
drops edges whose `sourceHandle`/`targetHandle` is no longer valid for that node. Every
node with dynamic ports gets the fix for free.
