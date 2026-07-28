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

Drag from a right-hand port to a left-hand port. Selecting a connection and pressing
<kbd>Delete</kbd> removes it — with no confirmation, because a connection is trivial to
redraw. Nodes are confirmed, connections are not.

### Connection shape

A toggle in the bottom-right cluster switches every connection between:

| | |
|---|---|
| **Straight** | The trimmed step edge — orthogonal runs, rounded elbows, arrowhead square to the card |
| **Curved** | React Flow's own bezier |

The shape is a **view preference, not edge data**. It is stamped on at render time
([`lib/edgeShape.js`](../frontend/src/lib/edgeShape.js)), which is what lets the toggle
re-route connections already on the canvas instead of only affecting new ones. Edges that
already carry the right type keep their object identity, so flipping the toggle doesn't
invalidate the whole graph. The in-progress connection line follows the same setting.

### Fit view

React Flow's built-in fit frames the graph into the **whole pane**. The canvas here runs
full-bleed underneath the floating chrome — that is what gives the glass something to
refract — so the built-in fit reliably parks nodes under the header, the node rail and the
bottom-right instruments.

[`lib/fitViewport.js`](../frontend/src/lib/fitViewport.js) frames into the free rectangle
instead: it insets the pane by the chrome, asks React Flow's `getViewportForBounds` to fit
into that smaller box, then translates the result onto it. The built-in button is
*replaced* rather than extended, because `Controls` runs its own fit before calling any
handler — leaving it in place would frame the graph badly and then animate away from it.

If the window is too small to inset, or there is nothing to frame, it returns `null` and
the caller falls back to React Flow's fit. Better a cramped frame than none.

### Deleting

Three routes, deliberately:

1. <kbd>Delete</kbd> / <kbd>Backspace</kbd> on a selection.
2. **Drag a node onto the bin** at the bottom-right.
3. Click the bin to delete the current selection.

React Flow drags nodes with **pointer events, not HTML5 drag-and-drop**, so there is no
`drop` event to listen for. The bin instead hit-tests pointer coordinates against its own
rect during `onNodeDrag`, and only flips state on a boundary crossing so it doesn't
re-render at frame rate.

The bin opens its lid and turns red as a node comes over it, the node shrinks and tilts in
your hand, and on confirm a card-shaped stand-in arcs into the bin as it gulps. Cancelling
returns the node to where the drag started, so it isn't left parked on top of the bin. All
motion is suppressed under `prefers-reduced-motion`.

---

## Nodes

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
config object, and the five new ones were chosen to prove different capabilities of the
abstraction rather than to be plausible products.

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
glass header makes that header a containing block for `position: fixed`, so a dialog
rendered inside it centres itself in the header rather than the screen.

---

## Design

A minimal glassmorphic interface over a semantic token layer in
[`tailwind.config.js`](../frontend/tailwind.config.js). A fixed three-point radial wash —
indigo, violet, cyan over near-white — gives the glass something to refract. Chrome
surfaces share one recipe: translucent white, a light border, `backdrop-blur-xl`.

**Node cards deliberately skip `backdrop-blur`.** Each blurred layer is its own compositing
pass and a canvas can hold hundreds of cards; real glass is reserved for the handful of
chrome surfaces, where the cost is bounded. Cards are opaque white with a soft category
tint behind the header — which also means overlapping nodes never show through each other.

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
