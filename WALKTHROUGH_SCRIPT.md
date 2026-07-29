# Walkthrough video — recording script

Target length **~12 minutes**. `SAY` is spoken; `DO` is a stage direction and never read out.

**Code is only opened twice** — Part 1 (the node abstraction) and Part 4 (the backend). Parts
2 and 3 are demonstrated live in the UI, because the styling and the Text node are things you
*see*. Eight files total.

Every requirement in [VectorShift.md](VectorShift.md) is covered — **Appendix D** maps each
one to the beat that addresses it.

Tone: showing a colleague, not presenting to a panel. Short sentences. Don't narrate what's
obviously on screen.

---

## Before you hit record

**Terminals** — two, both already running.

```bash
cd frontend && npm start          # localhost:3000
cd backend  && uvicorn main:app --reload
```

**Browser** — one tab, no bookmarks bar, 1920×1080, zoom at 90%. Hard-refresh for an empty
canvas.

**Editor** — close every tab, bump the font two steps, file tree collapsed to `frontend/src`
and `backend`.

**Production notes**

- Record Act 1 in one take with the voiceover running, then **speed the dragging to ~2× in
  the edit**. Ten nodes in real time is four minutes of watching a cursor.
- Hit **Fit view** whenever the graph drifts. Don't apologise for it on mic.
- The rail is collapsed to icons until you hover it — say that once, early.

---

## Timing map

| Act | Covers | Code? | Runs |
|---|---|---|---|
| 0 | Cold open | — | 0:00 – 0:30 |
| 1 | Build the pipeline | — | 0:30 – 4:30 |
| 2 | **Part 1** — node abstraction + live-add a node | ✅ | 4:30 – 7:30 |
| 3 | **Part 2** — styling | — | 7:30 – 8:45 |
| 4 | **Part 3** — Text node | — | 8:45 – 10:15 |
| 5 | **Part 4** — backend | ✅ | 10:15 – 11:45 |
| 6 | Close | — | 11:45 – 12:15 |

---

# Act 0 — Cold open

> **DO —** Empty canvas. Don't touch anything.

> **SAY —**
>
> "This is the VectorShift frontend assessment — a node-based pipeline builder. React and
> React Flow on the front, FastAPI on the back.
>
> I'll build a pipeline so you can see it working, then go through the four parts of the
> brief. Run commands are unchanged, by the way — `npm i`, `npm start`, and `uvicorn`.
>
> Rail on the left is the node library, it opens on hover. Two actions top right, canvas
> controls bottom right. No header bar — the canvas is the product."

---

# Act 1 — Build the pipeline

A **support-ticket triage flow**, using all nine node types. The shape is deliberately
logical — a nonsense graph makes the nodes look arbitrary too.

> Webhook → parse the JSON → filter for refunds → compose a prompt → LLM → POST to a CRM →
> out. Non-refunds exit through a second output.

```
row 1:   Webhook ──> JSON Parse ──> Filter ──┬──> Text ──> LLM
         Input ───────────────────────────────────^
row 2:                              Filter fail ──> Output(2)
                                    LLM ──> API Request ──> Output(1)
         Note  (parked top-right, unconnected)
```

## 1.1 — Webhook

> **DO —** Hover the rail. Drag **Webhook** onto the canvas, top left.

> **SAY —**
>
> "Library's grouped by category, and that grouping comes off the node configs rather than
> being hand-written.
>
> Starting with a Webhook. This is the anatomy of every card — icon, title, and this pill is
> the node's **id**, which is what downstream nodes reference. Ports on the edges, fields in
> the middle, and the panel on the right is the **outputs** it emits."

> **DO —** Set **Path** to `/hooks/ticket`. Point at the red *Required* on Signing secret,
> then type `whsec_demo` — it clears.

> **SAY —**
>
> "Required fields say so immediately rather than waiting for submit."

> **DO —** Toggle **Verify signature** off — the secret field vanishes. Toggle back on.

> **SAY —**
>
> "And fields can be conditional. One line in the config."

## 1.2 — JSON Parse

> **DO —** Drag **JSON Parse** in, right of Webhook.

> **SAY —**
>
> "JSON Parse is the most interesting of the new nodes — its ports *and* its outputs both come
> from one field."

> **DO —** Change **Fields** to `id, email, message`. Pause on the third port appearing.

> **SAY —**
>
> "Add a field, get a port, and the outputs panel grows with it."

> **DO —** Click **Sort fields A–Z**. Then connect **Webhook `payload`** →
> **JSON Parse `json`**.

> **SAY —**
>
> "There's an action button that rewrites that same field, and the ports follow it.
>
> Wiring is a drag from an output port to an input port."

## 1.3 — Filter

> **DO —** Drag **Filter** in. Set **Condition** `contains`, **Value** `refund`.

> **SAY —**
>
> "Filter branches — two source ports, pass and fail."

> **DO —** Switch Condition to **is empty**; the Value field vanishes. Switch back, retype
> `refund`. Connect **JSON Parse `message`** → **Filter `input`**.

> **SAY —**
>
> "Unary operator, and the value field goes — nothing to compare against."

## 1.4 — Input

> **DO —** Drag **Input** in, below Webhook. Change **Name** to `agent_name`.

> **SAY —**
>
> "A manual entry point alongside the webhook. Name defaulted from the node id — and watch the
> outputs panel update as I type, because its outputs are a function of its data."

## 1.5 — Text

> **DO —** Drag **Text** in, right of Filter. Select all, type:
>
> ```
> Ticket: {{ticket}}
> Agent: {{agent}}
> ```

> **SAY —**
>
> "Text node — that's its own part of the brief, so I'll come back to it. Quick version: two
> variables, two ports on the left, and the box grows as I type."

> **DO —** Connect **Filter `pass`** → **Text `ticket`**, **Input `value`** →
> **Text `agent`**.

## 1.6 — LLM

> **DO —** Drag **LLM** in. Tick **Use personal API key** — the password field appears.
> Untick. Connect **Text `output`** → **LLM `prompt`**.

> **SAY —**
>
> "LLM node. Two target ports, system and prompt. Tick the personal-key box and a required
> password field appears — same conditional mechanism again."

## 1.7 — API Request

> **DO —** Drag **API Request** in, second row. Clear the **URL**, type `not-a-url` — error
> shows. Then set it to `https://crm.example.com/v1/tickets`, **Method** `POST`.

> **SAY —**
>
> "API Request posts the result on. Real URL validation — though it's advisory, it warns
> without blocking submit.
>
> Two source ports, ok and error, so the failure path is a first-class branch."

> **DO —** Connect **LLM `response`** → **API Request `body`**.

## 1.8 — Outputs ×2

> **DO —** Drag **Output** in, name it `crm_result`. Drag a second, name it `unmatched`.
> Connect **API Request `ok`** → Output 1, **Filter `fail`** → Output 2.

> **SAY —**
>
> "Two outputs — the CRM result, and the tickets that didn't match. Ids are the lowest free
> number per type, so deleting one frees it again."

## 1.9 — Note

> **DO —** Drag **Note** in, park it top-right. Type
> `Refund tickets go to the CRM. Everything else exits here.`

> **SAY —**
>
> "And a Note — no header, no ports, no fields. It's in here as the degenerate case: proof the
> abstraction doesn't force every node to look alike."

## 1.10 — Canvas controls

> **DO —** **Fit view**. Toggle **connection shape** to curved and back. Toggle **Lock**.

> **SAY —**
>
> "Fit view frames the graph into the space the floating panels leave free. The shape toggle
> re-routes everything at once. Lock freezes dragging, connecting and selecting."

> **DO —** Delete the Filter→Output 2 edge via its **✕**, then redraw it. Then click **✕** on
> the Note card — dialog appears — **Cancel**.

> **SAY —**
>
> "Edges delete with no confirmation — it's one drag to put back. Nodes ask first, because
> deleting one takes its connections with it."

---

# Act 2 — Part 1: the node abstraction  💻

> **DO —** Editor. Open the tree to `frontend/src/nodes/configs/` — all nine configs visible.

> **SAY —**
>
> "Part one. The brief asked for an abstraction that speeds up making new nodes and applying
> styles across them, plus five new nodes to show it off.
>
> Here's the state of it: nine node types, nine config files, no per-node component code
> anywhere. That includes the four that shipped with the assessment — Input, Output, LLM and
> Text are all configs now. An abstraction only the new nodes use isn't an abstraction.
>
> The five new ones are Filter, API Request, Webhook, JSON Parse and Note."

### `frontend/src/nodes/configs/filter.config.js`

> **DO —** Open it. Whole file on one screen.

> **SAY —**
>
> "This is the entire Filter node. Not the config *for* it — this *is* it. There's no Filter
> component in the codebase.
>
> Identity at the top. `fields` renders in order —" **DO: point at line 31** "— and that's the
> conditional you saw. `handles` is the ports; targets default left, sources right, and they
> space themselves down the side. And `outputs` is the panel on the right.
>
> Fifty lines, no JSX."

### `frontend/src/nodes/registry.js`

> **DO —** Open it. Lines 12–30.

> **SAY —**
>
> "Configs go in one array, and everything derives from it — the map React Flow needs, the
> rail groupings, and the default data for a new node.
>
> So adding a node type is: one config file, one line here."

### `frontend/src/nodes/core/createNode.js`

> **DO —** Open it. Lines 18–34.

> **SAY —**
>
> "`createNode` turns a config into a component. Two things worth pointing at.
>
> One —" **DO: lines 18–23** "— handles and outputs get *resolved*. Array, or a function of
> the node's data. That's what keeps the Text node from being a special case: dynamic ports
> aren't bolted on for Part 3, they're just a config that happens to be a function.
>
> Two —" **DO: lines 31–34** "— React Flow doesn't remove an edge when its handle disappears.
> It survives, pointing at nothing, and still counts toward the edge total. So we prune
> centrally whenever the handle set changes. Every node with dynamic ports gets that for
> free."

### The live proof — add a tenth node on camera  ⏱ ~60s

The brief's wording is *"speeds up your ability to create new nodes."* Show it.

> **DO —** Config below already in your clipboard. New file
> `frontend/src/nodes/configs/delay.config.js`, paste, save.

```js
import { Clock } from 'lucide-react';

export const delayConfig = {
  type: 'delay',
  label: 'Delay',
  description: 'Pause before continuing',
  icon: Clock,
  category: 'utility',
  fields: [
    {
      key: 'ms',
      type: 'number',
      label: 'Wait (ms)',
      required: true,
      help: 'How long to hold the record before passing it on.',
      defaultValue: 1000,
      numeric: { min: 0, max: 60000, step: 100 },
    },
  ],
  handles: [
    { type: 'target', id: 'input' },
    { type: 'source', id: 'output' },
  ],
  outputs: [{ key: 'output', type: 'Any', description: 'The input, unchanged' }],
};
```

> **SAY —** *(while pasting)*
>
> "Let me just do it instead of claiming it. A Delay node — identity, one number field, two
> handles, one output."

> **DO —** `registry.js` — **type the two lines by hand**: the import, and `delayConfig,` in
> the array.

> **SAY —**
>
> "Two lines in the registry."

> **DO —** Browser. Hot-reloads. Hover the rail — **Delay** is under Utility. Drag it onto
> empty canvas.

> **SAY —**
>
> "And it's there. Id pill, outputs panel, required marker, help tooltip, type badge, working
> ports. I wrote no markup and no styling."

> **DO —** Terminal: `npm run test:ci`. Point at the total. Then delete the node from the
> canvas.

> **SAY —**
>
> "And the tests picked it up. The registry test loops every config, so a new type gets four
> tests the moment it's in the array — I didn't write them, and I couldn't have forgotten to.
>
> That test file is also the evidence the abstraction is real rather than claimed: one test
> covering all nine types."

> ⚠️ **Dry-run this beat first** to confirm the test count, so you can say the number without
> squinting. (`Clock` is in your installed `lucide-react` — checked.) Revert with:
>
> ```bash
> git checkout frontend/src/nodes/registry.js
> rm frontend/src/nodes/configs/delay.config.js
> ```

> **DO —** Optional, 10s: back in the editor, flash `note.config.js` — don't walk it.

> **SAY —**
>
> "One last thing — there's a `render` escape hatch that replaces the card body entirely. Note
> uses it to end up with no header and no handles. An abstraction you can't get out of is a
> straitjacket."

---

# Act 3 — Part 2: styling  *(no code — this one you look at)*

> **DO —** Browser, full canvas in shot. Slow pan or zoom across the graph.

> **SAY —**
>
> "Part two. Everything you've seen is styled — not just the cards. The rail and its search,
> the dialogs, the zoom bar, the minimap, the empty state, the submit button and its loading
> state. No unstyled corner.
>
> Tailwind with a semantic token layer, `class-variance-authority` for the card variants, and
> `lucide-react` for icons. No component library — the markup's all original."

> **DO —** Hover a card so the lift shadow shows. Click it so the selected ring shows.

> **SAY —**
>
> "The 'apply styles across nodes' half of Part 1 lives here — one variant function owns every
> card, including its selected state. Change it once and all nine types move together."

> **DO —** Point at a couple of cards side by side.

> **SAY —**
>
> "Direction is flat, dense and light. One accent, indigo — ports, connections, badges, the
> title band. An earlier pass gave each category its own colour, but five hues on a dense
> canvas is noise, and the icon already tells you what a node is. So the one place colour
> means something is connections: grey while you're dragging, indigo once it exists.
>
> The flat cards, the tinted title band, the id pill and the outputs panel beside the inputs
> all follow what VectorShift's product actually does in their demo video. Direction is
> theirs; the markup is mine."

> **DO —** Drag the window narrow, to phone width, and back.

> **SAY —**
>
> "And it goes down to about 320. Rail caps its width, minimap hides, Clear all goes
> icon-only. Dragging still works on touch — React Flow uses pointer events, not the HTML5
> drag API."

---

# Act 4 — Part 3: the Text node  *(no code — all of this is visible)*

> **DO —** Zoom in on the Text node so the ports and the card edges are clearly in frame.

> **SAY —**
>
> "Part three. Two asks: the width *and* height grow with the text, and a variable in double
> curly brackets creates a handle on the left."

### Autosize

> **DO —** Type one long line — card gets **wider**. Then Enter and a few short lines — card
> gets **taller**. Separately, so each is unmistakable.

> **SAY —**
>
> "Width — and height. Both clamped, and past the clamp it scrolls rather than growing
> forever."

### Variables → left-hand handles

> **DO —** Add `Priority: {{priority}}`. Third port appears on the left. Then delete the line.

> **SAY —**
>
> "Variable in braces, handle on the left, labelled with the name. First-appearance order, and
> deduped — the same variable twice gives you one port."

### The rename — the bit worth watching

> **DO —** Change `{{ticket}}` to `{{ticket_body}}`. **Point at the edge from Filter, still
> attached.**

> **SAY —**
>
> "This is the part I'd draw attention to. I renamed it and the connection survived.
>
> The obvious approach is to build the port id from the variable name — but then a rename is a
> remove-and-recreate, and the edge into it dies. So ids are positional and the name is only
> the label."

### Deletion and pruning

> **DO —** Delete the whole `Agent: {{agent}}` line. Port goes, **and the edge from Input goes
> with it.**

> **SAY —**
>
> "Delete a variable for real, and the port goes — and so does the edge. That's the pruning
> from earlier. Without it that edge sits in the payload inflating the count, and it can make
> an acyclic pipeline report as cyclic."

> **DO —** Type `{{2bad}}`. Warning appears. Delete it.

> **SAY —**
>
> "And invalid names warn instead of silently vanishing — validated as real JS identifiers,
> reserved words rejected."

> **DO —** Retype `Agent: {{agent}}` and redraw the Input edge, so Act 5's counts are clean.

---

# Act 5 — Part 4: the backend  💻

> **DO —** Browser. **Fit view**. Click **Submit**.

> **SAY —**
>
> "Part four. Submit posts the graph, the backend counts nodes and edges and says whether it's
> a DAG.
>
> Canvas seals while it's in flight — the graph's read once, at click time.
>
> Ten nodes, eight edges, and it is a DAG. The brief says create an alert showing the values
> 'in a user-friendly manner' — so it's a focus-trapped dialog rather than `window.alert`.
> Three tiles and a plain-English reading. `window.alert` satisfies the sentence and not the
> intent."

> **DO —** Close. Connect **API Request `error`** → **JSON Parse `json`**. **Submit**.

> **SAY —**
>
> "Let me break it. Error branch back into the parser — that's a retry loop, and a retry loop
> is a cycle. Nine edges, and `is_dag` is false."

> **DO —** Close. Delete that edge.

### `frontend/src/submit.js`

> **DO —** Open it. Lines 15–37.

> **SAY —**
>
> "Front-end side. The one thing I'd flag is the first line — `flushPending`.
>
> Field edits are debounced so typing doesn't re-render the graph. Which means type, then
> immediately click Submit, and the store still holds the old value — you'd silently send
> stale data. So every debounced field registers a flush, and submit fires them all before it
> reads the graph. There's a test that types and submits with no delay.
>
> The payload's also stripped to id, type, data and the edge endpoints — React Flow's render
> state doesn't go over the wire."

### `backend/main.py`

> **DO —** Open it. Whole file, 31 lines.

> **SAY —**
>
> "Backend's small. One route, exactly three keys, no envelope."

### `backend/dag.py`

> **DO —** Open it. Whole file, 35 lines.

> **SAY —**
>
> "Cycle detection is Kahn's — in-degree zero drains into a queue, and anything left has a
> dependency that can't resolve, which only a cycle causes. Linear.
>
> Iterative rather than recursive so a deep pipeline can't blow Python's stack — there's a
> ten-thousand-node test. And two edge cases decided on purpose: an edge to an unknown node is
> ignored, a self-loop is a cycle."

---

# Act 6 — Close

> **DO —** Back to the canvas, fit view, finished pipeline on screen.

> **SAY —**
>
> "So — four parts.
>
> A node type is one config plus one registry line. The four originals were converted onto it,
> five new ones demonstrate it, and you watched a tenth get built in about a minute.
>
> Styling is a token layer with one variant function over every card, across the whole app.
>
> The Text node grows both ways and turns variables into left-hand handles — and that falls
> out of the abstraction rather than working around it.
>
> And the backend counts the graph and does an iterative DAG check.
>
> 120 tests, and there's a README plus three docs with the reasoning — including real
> limitations. No persistence, no undo, light theme only, and validation warns rather than
> blocks.
>
> Thanks for watching."

---

## Appendix A — Pipeline cheat-sheet

**Nodes (10, all 9 types)**

| # | Type | Id | Field changes |
|---|---|---|---|
| 1 | Webhook | `webhook-1` | Path `/hooks/ticket`, secret `whsec_demo` |
| 2 | JSON Parse | `jsonParse-1` | Fields `id, email, message`, then Sort A–Z |
| 3 | Filter | `filter-1` | Condition `contains`, Value `refund` |
| 4 | Input | `customInput-1` | Name `agent_name` |
| 5 | Text | `text-1` | `Ticket: {{ticket}}` / `Agent: {{agent}}` |
| 6 | LLM | `llm-1` | defaults; tick+untick personal key |
| 7 | API Request | `apiRequest-1` | `POST`, `https://crm.example.com/v1/tickets` |
| 8 | Output | `customOutput-1` | Name `crm_result` |
| 9 | Output | `customOutput-2` | Name `unmatched` |
| 10 | Note | `note-1` | `Refund tickets go to the CRM. Everything else exits here.` |

**Edges (8)**

| From | Port | To | Port |
|---|---|---|---|
| `webhook-1` | payload | `jsonParse-1` | json |
| `jsonParse-1` | message | `filter-1` | input |
| `filter-1` | pass | `text-1` | ticket |
| `customInput-1` | value | `text-1` | agent |
| `text-1` | output | `llm-1` | prompt |
| `llm-1` | response | `apiRequest-1` | body |
| `apiRequest-1` | ok | `customOutput-1` | value |
| `filter-1` | fail | `customOutput-2` | value |

**Expected submit results**

| When | nodes | edges | is_dag |
|---|---|---|---|
| Act 5 first submit | 10 | 8 | ✅ true |
| After the retry edge | 10 | 9 | ❌ false |

> ⚠️ Act 4 deletes `{{agent}}`, which prunes the Input→Text edge. **The script tells you to
> retype it and redraw the edge at the end of Act 4** — do that, or Act 5 reads 7 edges, not
> 8.

> ⚠️ Act 2's Delay node goes on **empty canvas, unwired**, and gets deleted straight after. If
> you wire it in, your Act 5 counts change.

---

## Appendix B — File open order

Eight files. Two acts. Everything else is the browser.

| Act | File | On screen |
|---|---|---|
| 2 | `frontend/src/nodes/configs/filter.config.js` | whole file |
| 2 | `frontend/src/nodes/registry.js` | L12–30 |
| 2 | `frontend/src/nodes/core/createNode.js` | L18–23, then L31–34 |
| 2 | *(new)* `frontend/src/nodes/configs/delay.config.js` | created live, pasted |
| 2 | `frontend/src/nodes/registry.js` | again — two lines typed by hand |
| 2 | `frontend/src/nodes/configs/note.config.js` | optional 10s flash |
| 5 | `frontend/src/submit.js` | L15–37 |
| 5 | `backend/main.py` | whole file |
| 5 | `backend/dag.py` | whole file |

Deliberately **not** opened on camera: `tailwind.config.js`, `nodeVariants.js`, `index.css`,
`text.config.js`, `parseVariables.js`, `api.js`, `models.py`, `registry.test.js`. Parts 2 and
3 are shown in the UI; the rest is mentioned in passing. If a reviewer asks, the docs cover
them.

---

## Appendix C — Shorter cut

To reach **8 minutes**, drop in this order:

1. Act 3's responsive demo.
2. Act 1's Filter unary-operator demo and the API Request URL validation.
3. Act 2's `createNode.js` — but move its edge-pruning point into Act 4, where you demo it.
4. Act 2's `note.config.js` flash.

**Don't cut:**

| Beat | Act | Why |
|---|---|---|
| Live-adding the Delay node | 2 | Only direct evidence for "speeds up creating new nodes" |
| Text rename keeping its edge | 4 | A design decision, not a feature |
| Variables → left-hand handles | 4 | Literal Part 3 requirement |
| Autosize both dimensions | 4 | Literal Part 3 requirement — show them separately |
| Cycle flipping `is_dag` | 5 | Literal Part 4 requirement, 20 seconds |
| JSON Parse ports from one field | 1 | Best argument the abstraction is general |

---

## Appendix D — Requirements checklist

Every requirement in [VectorShift.md](VectorShift.md), and where it's covered.

### Setup and stack

| Brief says | Covered in |
|---|---|
| JavaScript/React frontend | Act 0 |
| Python/FastAPI backend | Act 0 |
| Runs with `npm i` + `npm start` | Act 0 |
| Runs with `uvicorn main:app --reload` | Act 0 |

### Part 1 — Node abstraction  *(code shown)*

| Brief says | Covered in |
|---|---|
| Speeds up **creating new nodes** | Act 2 — **proven live**, Delay node in ~60s |
| Lets you **apply styles across nodes** | Act 2 mention + Act 3 hover/select demo |
| Applies to the four provided nodes too | Act 2 opening |
| **Five new nodes** | Named in Act 2; all five built and used in Act 1 |
| Showcases flexibility | Act 1 (each node's trick) + `render`/`bare` via Note |

### Part 2 — Styling  *(UI demo)*

| Brief says | Covered in |
|---|---|
| Style **the various components** | Act 3 — rail, dialogs, controls, minimap, empty state, submit |
| Appealing, **unified** design | Act 3 — token layer, one accent, one card variant |
| VectorShift as inspiration | Act 3 — credited explicitly |
| Any React packages | Act 3 — Tailwind, CVA, lucide-react |

### Part 3 — Text node  *(UI demo)*

| Brief says | Covered in |
|---|---|
| **Width** grows with text | Act 4 — long line, shown separately |
| **Height** grows with text | Act 4 — added lines, shown separately |
| `{{variable}}` creates a Handle | Act 1.5 preview + Act 4 |
| Handle on the **left side** | Act 4 — said explicitly, visibly on the left |
| **Valid JavaScript variable name** | Act 4 — the `{{2bad}}` warning |

### Part 4 — Backend integration  *(code shown)*

| Brief says | Covered in |
|---|---|
| `submit.js` sends nodes and edges on click | Act 5, `submit.js` |
| Sends to `/pipelines/parse` | Act 5, `submit.js` / `main.py` |
| Counts **nodes** | Act 5, `main.py` + live result |
| Counts **edges** | Act 5, `main.py` + live result |
| Checks **DAG** | Act 5, `dag.py` + the live cycle demo |
| Response is `{num_nodes, num_edges, is_dag}` | Act 5, `main.py` |
| **Alert** on response | Act 5 happy path |
| All three values, **user-friendly** | Act 5 — three tiles, plain-English reading |
| End to end: build → submit → alert | Acts 1 and 5 together |

> State the one deviation out loud: the brief says *"create an alert"* and this is a dialog.
> Act 5 does that — the same sentence asks for "a user-friendly manner," which a native alert
> can't deliver. Saying so beats leaving a reviewer wondering.
