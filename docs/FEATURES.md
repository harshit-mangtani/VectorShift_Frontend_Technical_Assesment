# Features

What the app does, and why each piece works the way it does. Grouped by where you meet it
rather than by where it lives in the source.

---

## The node library

A **floating rail** down the left edge — detached from the window, rounded, shadowed.

- Collapsed it shows icons only; it expands on hover, on keyboard focus, or when pinned
  with the chevron. Width animates directly; the search field and group headings expand
  via a `grid-rows-[0fr] → [1fr]` transition so the height animates rather than snapping.
- Labels stay mounted while collapsed, so every entry keeps its accessible name even when
  the text is clipped to zero width.
- Nodes are grouped by category and filterable by name or description. The list height is
  locked while searching, so the rail doesn't jump as results narrow.
- **Two ways to add**: drag onto the canvas, or click to drop one in the centre. Click-to-add
  exists because HTML5 drag-and-drop never fires on touch — on a phone it is the only route.

Unpinning hands control back to hover rather than collapsing outright. Clicking the pin
also focuses it, and focus alone holds the rail open, so the pin handler distinguishes a
pointer activation (`event.detail > 0`) from a keyboard one and releases focus for the
former.

---

## The canvas

### Connections

Drag from a right-hand port to a left-hand port. Every connection carries a **✕ at its
midpoint** — one click and it's gone, with no confirmation, because a connection is
trivial to redraw. Nodes are confirmed, connections are not. Selecting one and pressing
<kbd>Delete</kbd> works too.

The button is real DOM on an SVG path, which only works through React Flow's
`EdgeLabelRenderer` — an overlay that tracks the viewport transform. That overlay is
`pointer-events: none`, so the button re-enables them for itself.

### Connection shape

A toggle in the bottom-right cluster switches every connection between:

| | |
|---|---|
| **Straight** | The trimmed step edge — orthogonal runs, rounded elbows, arrowhead square to the card |
| **Curved** | React Flow's bezier, wrapped so it keeps the midpoint ✕ |

The shape is a **view preference, not edge data**. It is stamped on at render time
([`lib/edgeShape.js`](../frontend/src/lib/edgeShape.js)), which is what lets the toggle
re-route connections already on the canvas instead of only affecting new ones. Edges that
already carry the right type keep their object identity, so flipping the toggle doesn't
invalidate the whole graph. The in-progress connection line follows the same setting.

### Fit view

React Flow's built-in fit frames the graph into the **whole pane**. The canvas here runs
full-bleed underneath the floating chrome — that is what gives the glass something to
refract — so the built-in fit reliably parks nodes under the action buttons, the rail and
bottom-right instruments.

[`lib/fitViewport.js`](../frontend/src/lib/fitViewport.js) frames into the free rectangle
instead: it insets the pane by the chrome, asks React Flow's `getViewportForBounds` to fit
into that smaller box, then translates the result onto it. The built-in button is
*replaced* rather than extended, because `Controls` runs its own fit before calling any
handler — leaving it in place would frame the graph badly and then animate away from it.

If the window is too small to inset, or there is nothing to frame, it returns `null` and
the caller falls back to React Flow's fit. Better a cramped frame than none.

### Deleting

Two routes to a node:

1. The **✕ on the card itself** — no selection step.
2. <kbd>Delete</kbd> on a selected node.

Both converge on one store field, `pendingDeleteId`, so there is exactly one confirmation
dialog no matter where the request came from.

React Flow's own `deleteKeyCode` removes the selection outright, which is the wrong
default for something irreversible — so it is switched off and the key is handled here.
<kbd>Delete</kbd> only, never <kbd>Backspace</kbd> — Backspace is an editing key before
it is a destructive one, and binding it canvas-wide means one stray press outside a field
costs a node. The handler also ignores the keystroke when it was delivered to a field, and
reads `event.target` rather than `document.activeElement`: the key went to whatever had
focus, and that element is the one entitled to consume it.

A **connection** goes without a dialog either way — the ✕ at its midpoint, or Delete while
it's selected. When a node and a connection are both selected the node wins, because that
is the larger of the two actions and the one worth asking about.

---

## Nodes

### Card anatomy

```
┌─────────────────────────────────────────────┐┌────────────────────────┐
│ ▣  LLM                                   ✕  ││  ⊟      Outputs        │   ← tinted band
│    Run a prompt through a model             ││ Type "{{" in downstream│
│ ╭─────────────── llm-1 ──────────────────╮  ││ nodes to leverage …    │
├─────────────────────────────────────────────┤├────────────────────────┤
│ Model                            [Dropdown] ││ Output Fields     Type │
│ ┌─────────────────────────────────────────┐ │├────────────────────────┤
│ │ GPT-4o                                ⌄ │ ││ response        [Text] │
│ └─────────────────────────────────────────┘ ││ The output of the model│
│ Temperature ⓘ                      [Number] │├────────────────────────┤
└─────────────────────────────────────────────┘│ Advanced Outputs     ⌄ │ ← tinted band
                                               └────────────────────────┘
```

Cards sit at an 8px radius with tight padding — denser than the surrounding chrome, which
keeps its softer 12–16px. At canvas scale that reads as instrument rather than panel.

**The identifier pill.** Every node shows its own id, in the same band as its title and
description. It's what a `{{reference}}` resolves against, and without it the only way to
know a node's id is to remember the order you added things in.

**The header ✕.** Deletes the node it belongs to, selected or not. It writes the same
`pendingDeleteId` the Delete key does, so both routes share one confirmation dialog rather
than each growing its own.

**Type badges.** Each field states what it accepts — `Text`, `Dropdown`, `Number`,
`Secret` — derived from `field.type`, overridable per field, and suppressible with
`badge: null`. Tickboxes and switches carry none: the control already says it is a yes/no.

**Controls.** Beyond text, number and select there are three more, all config-declared:
a **toggle** (`role="switch"`, optionally naming both states — JSON Parse switches between
*Object* and *Array*), a **secret** (masked, and usually revealed by a tickbox — the LLM
node's API key appears only when you opt out of workspace credits), and an **action**: a
button whose `run(data, set)` writes back to its own node. JSON Parse's *Sort fields A–Z*
rewrites the field its ports are derived from, so the ports re-order with it.

Actions are deliberately narrow. `set` is bound to the node the button sits on, so a config
can't reach across the canvas — node behaviour stays reviewable by reading one file.

**Required markers and help.** `required: true` gives a red `*`, `aria-required`, and an
inline *Required* while the value is blank — and it outranks any custom `validate`, since
there is nothing to validate yet. `help: '…'` renders a `ⓘ` with a tooltip, and is wired to
the control with `aria-describedby`.

The tooltip is built rather than left to the `title` attribute. lucide renders an `<svg>`,
and a `title` *attribute* on an SVG element doesn't reliably produce a tooltip — SVG expects
a `<title>` child — so the help text was silently invisible. It also appears immediately
rather than after the UA's delay. The string exists twice: the bubble is `aria-hidden`, and
a screen-reader copy is what `aria-describedby` points at, because a hidden bubble would be
unreachable at the moment the control takes focus.

Everything except the field name sits **outside** the `<label>`. The control's accessible
name has to stay exactly the label — otherwise a screen reader announces "Endpoint star
info Text", and `getByLabelText('Endpoint')` stops resolving.

**The outputs panel.** A node that declares `outputs` gets a second column naming every
field it emits, with a type and a one-line description. Fields marked `advanced` start
collapsed.

This is declaration, not execution — nothing runs a pipeline here. The point is that the
data contract is the thing you most need while wiring, and it's exactly what a node canvas
normally hides until you connect something and see what comes out.

The list caps its height and scrolls, since a derived set has no bound the config controls.
Anything scrollable inside the canvas carries React Flow's `nowheel` class — otherwise the
pane swallows the wheel to zoom and the only way to move the list is to drag its scrollbar.
The same applies to a textarea that outgrows its rows.

Like `handles`, `outputs` can be a function of `data`: **Database** emits `rows` in read
mode and `written` in write mode; **JSON Parse** derives its ports *and* its contract from
one comma-separated field.

### The Text node

- The field is a textarea that **grows in both dimensions** — height from `scrollHeight`,
  width from the widest line measured on a shared canvas context — clamped, then scrolling
  rather than growing forever.
- `{{variable}}` names become left-hand target ports, in first-appearance order, deduped,
  and validated as real JavaScript identifiers. Reserved words are rejected. Invalid names
  raise an inline warning rather than vanishing silently.
- Ports need vertical separation, and that room is reserved **on the textarea**, not on the
  card. Reserving it on the card left dead space beneath the field that persisted, because
  it tracked the port count rather than the text; on the field it is usable typing area.

**Port IDs are positional (`in-0`, `in-1`, …), deliberately decoupled from the variable
name.** An ID built from the name makes every rename a remove-and-recreate: React Flow
tears down the port, existing connections point at something that no longer exists, and
the replacement is unmeasured. With positional IDs a rename only changes `label`, so
connections survive it untouched.

### Every other node

See [NODE_ABSTRACTION.md](NODE_ABSTRACTION.md). The short version: a node type is one
config object, and the new ones were chosen to prove different capabilities of the
abstraction rather than to be plausible products — two source handles, per-field
validation, a field that rewrites the node's own topology, a node with no inputs at all,
and one whose ports and contract both come from a single text field.

---

## Submitting

**Submit** posts the graph to `POST /pipelines/parse` and opens a result dialog with node
count, edge count, and whether the pipeline is a DAG — plus a plain-English reading of what
that means.

Field edits are debounced, which creates a hazard worth naming: clicking Submit immediately
after typing would otherwise send the *previous* value. `flushPending()` forces outstanding
commits before the payload is read, and `App.test.js` covers exactly that race.

**Clear all** empties the canvas behind a confirmation.

Both dialogs are portalled to `document.body`. They have to be: `backdrop-filter` on the
glass surface makes that surface a containing block for `position: fixed`, so a dialog
rendered inside one centres itself in its parent rather than the screen.

While a submit is in flight the canvas is sealed behind a scrim. The graph is read once,
at click time; letting it be edited mid-flight would return an answer about a pipeline
that no longer exists.

---

## Design

A minimal glassmorphic interface over a semantic token layer in
[`tailwind.config.js`](../frontend/tailwind.config.js). A fixed three-point radial wash —
indigo, violet, cyan over near-white — gives the glass something to refract. Chrome
surfaces share one recipe: translucent white, a light border, `backdrop-blur-xl`.

**Node cards deliberately skip `backdrop-blur`.** Each blurred layer is its own compositing
pass and a canvas can hold hundreds of cards; real glass is reserved for the handful of
chrome surfaces, where the cost is bounded. Cards are opaque white with a soft category
tint behind the title band — which also means overlapping nodes never show through each
other. Category drives grouping, not colour: five hues across a dense canvas read as noise
rather than information, so one indigo accent carries the whole set.

### Transforms and measurement

One rule that shaped several decisions: **React Flow reads port positions with
`getBoundingClientRect()`, which includes CSS transforms, but only re-reads them when a
ResizeObserver fires — and a transform never fires one.**

A port measured while its card is mid-animation is therefore recorded in the wrong place,
by a fraction of the card's own width, *permanently*. This is what made arrowhead spacing
differ per node type and change as a Text node grew.

Two consequences in the code:

- [`useMeasureAfterTransform`](../frontend/src/hooks/useMeasureAfterTransform.js) re-reads
  a card's ports once its entrance animation or transform transition settles — guarded so
  it never measures a card that is still transformed.
- Port hover is a `box-shadow` halo rather than a `scale()`. Same affordance, no
  measurement side-effect. (It also stops the dot jumping, since `:hover` outranked the
  `translate(0, -50%)` that centres it.)

### Responsive

Down to ~320px. The rail caps its expanded width to the viewport, the minimap hides below
`sm`, the wordmark drops below `xs`, "Clear all" becomes icon-only, and a chevron toggle
replaces hover. Dragging nodes *on the canvas* still works on touch, because React Flow
drives that with pointer events.

---

## Accessibility

- Every field is a real labelled control. The node library entries keep their names while
  collapsed.
- The select is a **custom listbox**, because a native `<option>` cannot be styled to match.
  Arrow keys move a highlight, <kbd>Enter</kbd> commits, and a `keyNav` flag keeps the
  keyboard highlight separate from CSS `:hover` so the two can't disagree. Handled keys
  stop propagating, so committing an option doesn't also select the node behind it.
- Outside-click detection on the listbox uses **capture-phase** `pointerdown`/`mousedown`:
  React Flow's d3-zoom calls `stopImmediatePropagation`, so a bubble-phase listener never
  runs.
- Dialogs trap focus and close on <kbd>Escape</kbd>.
- All motion respects `prefers-reduced-motion`.
