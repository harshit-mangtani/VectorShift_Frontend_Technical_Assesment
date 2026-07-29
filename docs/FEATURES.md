# Features

What everything does and why. Grouped by where you meet it, not where it lives.

## The node library

A floating rail down the left — detached, rounded, shadowed.

- Collapsed it's icons only. It expands on hover, on keyboard focus, or when pinned. Labels
  stay mounted while collapsed so every entry keeps its accessible name.
- Grouped by category, filterable by name. The list height locks while you search so the
  rail doesn't jump as results narrow.
- **Two ways to add**: drag onto the canvas, or click to drop one in the middle.
  Click-to-add isn't just convenience — HTML5 drag-and-drop never fires on touch, so on a
  phone it's the only route.

Unpinning hands control back to hover rather than collapsing outright. Clicking the pin also
focuses it, and focus alone holds the rail open, so the handler tells a pointer activation
(`event.detail > 0`) from a keyboard one and releases focus for the former.

One shared easing curve drives the width, the reveals and the labels. They used to have
their own durations and arrived at different times, which read as a stutter. Labels keep a
fixed width and only fade — animating their width re-laid-out every row on every frame.

## The canvas

### Connections

Drag right port → left port. Every connection carries a **✕ at its midpoint** — one click,
no confirmation, because a connection is one drag to redraw. <kbd>Delete</kbd> works too
when it's selected.

The button is real DOM on an SVG path, which only works through React Flow's
`EdgeLabelRenderer` — an overlay that tracks the viewport transform. That overlay is
`pointer-events: none`, so the button re-enables them for itself. Its `transform` is its
position on the path, so nothing may transition it: the hover grow lives on a child instead,
or the ✕ eases along behind the line every time a node moves.

### Connection shape

A toggle switches every connection between:

| | |
|---|---|
| **Straight** | The trimmed step edge — orthogonal runs, rounded elbows, arrowhead square to the card |
| **Curved** | React Flow's bezier, wrapped so it keeps the midpoint ✕ |

Shape is a **view preference, not edge data**. It's stamped on at render
([`lib/edgeShape.js`](../frontend/src/lib/edgeShape.js)), which is what lets the toggle
re-route connections already on the canvas. Edges already carrying the right type keep their
object identity, so flipping it doesn't invalidate the graph. The in-progress line follows
the same setting — grey while you drag, indigo once it exists.

### Fit view

React Flow's built-in fit frames into the **whole pane**. The canvas runs full-bleed under
the floating chrome, so that reliably parks nodes under the action buttons, the rail, or the
bottom-right instruments.

[`lib/fitViewport.js`](../frontend/src/lib/fitViewport.js) frames into the free rectangle
instead: inset the pane by the chrome, ask `getViewportForBounds` to fit the smaller box,
translate the result onto it. The built-in button is *replaced* rather than extended, because
`Controls` runs its own fit before calling any handler — leaving it would frame badly and
then animate away from it. Too small to inset, or nothing to frame, returns `null` and falls
back to React Flow's fit.

### Lock

One switch, three React Flow flags — `nodesDraggable`, `nodesConnectable`,
`elementsSelectable`. The control presents them as one because that's how you think about it.

### Deleting

Two routes to a node: the **✕ on its card** (no selection step), or <kbd>Delete</kbd> when
it's selected. Both write the same `pendingDeleteId`, so there's exactly one confirmation
dialog no matter where the request came from.

React Flow's own `deleteKeyCode` removes the selection outright, which is the wrong default
for something irreversible, so it's off and the key is handled here.

<kbd>Delete</kbd> only, never <kbd>Backspace</kbd> — Backspace is an editing key before it's
a destructive one, and binding it canvas-wide means one stray press outside a field costs a
node. The handler also ignores the key when it went to a field, reading `event.target` rather
than `document.activeElement`: the key was delivered to whatever had focus, and that element
is the one entitled to consume it.

A node and a connection both selected? The node wins — it's the larger action and the one
worth asking about.

## Nodes

### Card anatomy

```
┌─────────────────────────────────────────────┐┌────────────────────────┐
│ ▣  LLM                                   ✕  ││  ⊟      Outputs        │   ← tinted band
│    Run a prompt through a model             ││ Type "{{" in downstream│
│ ╭─────────────── llm-1 ──────────────────╮  ││ nodes to leverage …    │
├─────────────────────────────────────────────┤├────────────────────────┤
│ System (Instructions) * ⓘ            [Text] ││ Output Fields     Type │
│ ┌─────────────────────────────────────────┐ │├────────────────────────┤
│ │ You are a helpful assistant…            │ ││ response        [Text] │
│ └─────────────────────────────────────────┘ ││ The output of the model│
│ Stream response ⓘ                      ◯──  │├────────────────────────┤
│ ☐ Use personal API key ⓘ                    ││ Advanced Outputs     ⌄ │ ← tinted band
└─────────────────────────────────────────────┘└────────────────────────┘
```

Cards sit at an 8px radius with tight padding — denser than the surrounding chrome, which
keeps its softer 12–16px. At canvas scale that reads as instrument rather than panel.

**The id pill.** Every node shows its own id, in the same band as its title and description.
It's what a `{{reference}}` resolves against; without it the only way to know a node's id is
to remember what order you added things in.

**The header ✕.** Deletes the node it belongs to, selected or not.

**Type badges.** Each field says what it accepts — `Text`, `Dropdown`, `Number`, `Secret` —
derived from `field.type`, overridable, `badge: null` to opt out.

**Required and help.** `required: true` gives a red `*`, `aria-required`, and an inline
*Required* while blank — and it outranks any custom `validate`, since there's nothing to
validate yet. `help` renders a `ⓘ` with a tooltip.

That tooltip is built rather than left to the `title` attribute. lucide renders an `<svg>`,
and a `title` *attribute* on an SVG element doesn't reliably produce a tooltip — SVG wants a
`<title>` child — so the help text was silently invisible. It also appears immediately rather
than after the UA's delay. The string exists twice: the bubble is `aria-hidden`, and a
screen-reader copy is what `aria-describedby` points at, because a hidden bubble is
unreachable at the moment the control takes focus.

Everything except the field name sits **outside** the `<label>`. The accessible name has to
stay exactly the label, or a screen reader announces "Endpoint star info Text" and
`getByLabelText('Endpoint')` stops resolving.

**Controls.** Beyond text, number and select there are three more, all config-declared: a
**toggle** (`role="switch"`, optionally naming both states — JSON Parse switches *Object* /
*Array*), a **secret** (masked, usually revealed by a tickbox — the LLM node's API key
appears only when you opt out of workspace credits), and an **action**: a button whose
`run(data, set)` writes back to its own node.

**The outputs panel.** A node declaring `outputs` gets a second column naming every field it
emits, with a type and a one-line description. `advanced` rows start collapsed.

This is declaration, not execution — nothing runs a pipeline here. The point is the data
contract is what you most need while wiring, and it's exactly what a node canvas normally
hides until you connect something and see what comes out.

The list caps its height and scrolls, since a derived set has no bound the config controls.
Anything scrollable inside the canvas carries React Flow's `nowheel` class — otherwise the
pane swallows the wheel to zoom and the only way to move the list is to drag its scrollbar.
Same for a textarea that outgrows its rows.

### The Text node

- The field is a textarea that **grows in both dimensions** — height from `scrollHeight`,
  width from the widest line measured on a shared canvas context — clamped, then scrolls.
- `{{variable}}` names become left-hand ports, in first-appearance order, deduped, validated
  as real JS identifiers. Reserved words rejected. Invalid names get an inline warning rather
  than vanishing.
- Ports need vertical separation, and that room is reserved **on the textarea**, not the
  card. On the card it left dead space beneath the field that persisted, because it tracked
  the port count rather than the text. On the field it's usable typing area.

**Port ids are positional (`in-0`, `in-1`), deliberately not the variable name.** An id built
from the name makes every rename a remove-and-recreate: React Flow tears the port down,
existing connections point at nothing, and the replacement is unmeasured. Positional ids mean
a rename only changes `label`, so connections survive untouched.

### The rest

See [NODE_ABSTRACTION.md](NODE_ABSTRACTION.md). Short version: a node type is one config
object, and the five new ones were chosen to prove different capabilities — two source
handles, validation across field types, a node with no inputs at all, one whose ports and
contract both come from a single text field, and one that's barely a node.

## Submitting

**Submit** posts to `POST /pipelines/parse` and opens a dialog with node count, edge count,
DAG status, and a plain-English reading of what that means.

Field edits are debounced, which creates a hazard worth naming: clicking Submit right after
typing would otherwise send the *previous* value. `flushPending()` forces outstanding commits
before the payload is read, and `App.test.js` covers exactly that race.

While the request is in flight the canvas is sealed behind a scrim. The graph is read once,
at click time; letting it be edited mid-flight would return an answer about a pipeline that
no longer exists.

**Clear all** empties the canvas behind a confirmation.

Both dialogs are portalled to `document.body`. They have to be: `backdrop-filter` on any
surface makes it a containing block for `position: fixed`, so a dialog rendered inside one
centres itself in its parent rather than the screen.

## Design

Flat, dense and light, over a semantic token layer in
[`tailwind.config.js`](../frontend/tailwind.config.js). Opaque white cards on a pale grey
dotted canvas, hairline borders, 8px radii on cards and the rail through 16px on dialogs,
two soft shadows —
`card` at rest, `lift` on hover and selection. Small tight type: 13px titles, 11px labels,
monospace for ids and output fields.

Taken from a VectorShift product demo video: the tinted title band, the id pill, the type
badges and the outputs panel beside the inputs.

Node cards are fully opaque; only the four surfaces that float over the graph — the node
rail, dialogs, the minimap and the instrument row — blur what's behind them, so the pipeline
stays visible underneath.

Category drives grouping, not colour. Five hues across a dense canvas read as noise rather
than information, so one indigo accent carries the whole set.

### Transforms and measurement

One rule shaped several decisions: **React Flow reads port positions with
`getBoundingClientRect()`, which includes CSS transforms, but only re-reads them when a
ResizeObserver fires — and a transform never fires one.**

A port measured while its card is mid-animation is recorded in the wrong place, by a fraction
of the card's own width, permanently. That's what made arrowhead spacing differ per node type
and change as a Text node grew.

- [`useMeasureAfterTransform`](../frontend/src/hooks/useMeasureAfterTransform.js) re-reads a
  card's ports once its entrance animation or transform transition settles — guarded so it
  never measures a card that's still transformed.
- Port hover is a `box-shadow` halo, not a `scale()`. Same affordance, no measurement
  side-effect. It also stops the dot jumping, since `:hover` outranked the
  `translate(0, -50%)` that centres it.

### Responsive

Down to ~320px. The rail caps its expanded width, the minimap hides below `sm`, "Clear all"
goes icon-only, and a chevron toggle replaces hover. Dragging nodes on the canvas still works
on touch, because React Flow drives that with pointer events.

## Accessibility

- Every field is a real labelled control. Library entries keep their names while collapsed.
- The select is a **custom listbox**, because a native `<option>` can't be styled to match.
  Arrows move a highlight, <kbd>Enter</kbd> commits, and a `keyNav` flag keeps the keyboard
  highlight separate from CSS `:hover` so the two can't disagree. Handled keys stop
  propagating, so committing an option doesn't also select the node behind it.
- Outside-click detection uses **capture-phase** `pointerdown`/`mousedown`: React Flow's
  d3-zoom calls `stopImmediatePropagation`, so a bubble-phase listener never runs.
- Dialogs trap focus and close on <kbd>Escape</kbd>.
- All motion respects `prefers-reduced-motion`.
