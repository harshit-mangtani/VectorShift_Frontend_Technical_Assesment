# Walkthrough — high level script

Your notes, filled in. Read it straight through; the *italic bits in brackets* are things to
do, not say. Roughly 9–10 minutes.

---

## Intro

Hey everyone, my name's Harshit Mangtani and here's my walkthrough for the frontend technical
assessment submission.

It's a node-based pipeline builder. **JavaScript and React** on the front end with React Flow
for the canvas, Zustand for state, Tailwind for styling, and Python with FastAPI on the
backend. Couple of small things on top of that — `class-variance-authority` for the node card
variants, `lucide-react` for icons, and Jest and pytest for tests.

Four parts to the brief, so let's go through them.

---

## Task 1 — node abstraction

*[Editor open, `frontend/src/nodes/configs/` visible in the tree]*

First task was the node abstraction. We got four base nodes — Input, Output, LLM and Text —
and I added five more of my own: Filter, API Request, Webhook, JSON Parse and a Note.

The key thing is all nine of them, including the four originals, are just **config objects**.
There's no per-node component code anywhere in the codebase. A node is one file that declares
what it is and what it has, and one line in a registry.

Between them they cover pretty much everything a node might need — text and textarea fields,
numbers, passwords, dropdowns, checkboxes, toggles, and action buttons that actually do
something to the node's own data. On top of that you get required markers, help tooltips,
inline validation, and fields that show and hide depending on other fields.

And the ports aren't fixed either. A node can declare its handles as a plain list, or as a
function of its data — which is how the Text node grows ports from variables, and how JSON
Parse grows both its ports *and* its outputs panel from one comma-separated field.

Each of the five new ones is in there to prove something different. Filter's got two output
branches and a conditional field. API Request has validation across three field types.
Webhook is output-only, no inputs at all. JSON Parse is the dynamic one. And the Note has no
header, no ports and no fields at all, proof a node doesn't have to
look like the others to work.

### Code to show here

Three files, in this order. Speech is what to read out; the *bracketed bits* are what to have
on screen while you say it.

---

**1. `nodes/configs/filter.config.js`** — *[whole file, fits on one screen]*

> This is the entire Filter node. Not the config *for* it — this **is** it. There's no Filter
> component anywhere.
>
> Identity at the top, then `fields`, which render in order — *[point at `visibleIf`]* and
> that's the conditional field from earlier, just a function of the node's data.
>
> `handles` is the ports, and I don't position them — inputs go left, outputs right, spaced
> automatically. `outputs` is the panel on the right of the card.
>
> Fifty lines, no JSX.

---

**2. `nodes/registry.js`** — *[the `nodeConfigs` array]*

> Every config goes in this one array and everything derives from it — *[point]* the map React
> Flow needs, the rail groupings off each config's category, and the default data for a new
> node.
>
> So adding a node type is one config file plus one line here. It's registered, in the rail,
> draggable, and already covered by the tests.

---

**3. `nodes/core/createNode.js`** — *[lines 18–34]*

> This turns a config into a component. Two things worth pointing at.
>
> *[highlight the resolve]* — handles and outputs get **resolved**: a plain array, or a
> function of the node's data. That's what stops the Text node being a special case — dynamic
> ports are just a config where `handles` is a function.
>
> *[highlight the prune effect]* — and React Flow doesn't remove an edge when its handle
> disappears. It survives attached to nothing, still gets sent to the backend, still counts
> toward the edge total. So we prune centrally whenever a node's handles change, and every node
> with dynamic ports gets that for free.

---

## The UI

*[Browser, canvas in shot]*

Let's walk through the UI. I started off with a glassmorphic kind of approach, then came
across a demo of the actual company product on YouTube and moved a lot closer to that — so the
flat cards, the tinted title band, the id pill on each node, the type badges and the outputs
panel beside the inputs all follow what VectorShift actually does. The markup and styling are
all mine, the direction's theirs.

It's one accent colour throughout, indigo. I had a version where every category had its own
colour and it just read as noise — the icon already tells you what a node is. The one place
colour means something is the connections: grey while you're dragging one out, indigo once
it's connected.

And it's responsive and mobile-friendly, down to about 320 pixels.

*[Drag the window narrow and back]*

### The side rail

Here's the side rail with all the nodes in it, grouped by category. Hover to expand, and it
collapses again when you move away — and there's a pin button to keep it open. You can click a
node to drop one in the middle, or drag and drop it onto the canvas wherever you want. There's
a search too. On mobile you get a button to expand and collapse instead of hover, since
there's no hover to speak of.

### Canvas controls

Down here on the right, this button toggles the connections between straight and curved lines
— and it re-routes everything that's already on the canvas, not just new ones.

Then the actions bar: zoom in, zoom out, fit view, and a lock that freezes dragging,
connecting and selecting all at once. Fit view is worth a mention — it frames the graph into
the space the floating panels leave free, so nothing ends up parked underneath the rail.

And a minimap of the whole canvas next to it.

### Clear all and submit

Top right, Clear all wipes every node and connection, behind a confirmation dialog so you
can't do it by accident.

And next to it, Submit — that's what sends everything to the backend to work out the number of
nodes, the number of edges, and whether it's a DAG. While it's in flight the screen goes into
a loading state, so you can't hit Clear all or edit a node halfway through and get an answer
about a pipeline that doesn't exist any more.

---

## Building the demo pipeline

*[Build it as you talk. Speed the dragging up ~2× in the edit]*

Let me build something real — a support ticket triage flow. A ticket comes in on a webhook, we
parse it, filter for refund requests, compose a prompt, run it through a model, and post the
result to a CRM. Anything that isn't a refund exits separately.

**Webhook** — set the path to `/hooks/ticket`. Notice the signing secret is showing a red
Required straight away rather than waiting for submit. Type anything in and it clears. And if
I turn off Verify signature, the field disappears entirely — that's a conditional field.

**JSON Parse** — change the Fields box to `id, email, message`. Watch — a port appears for
each one, and the outputs panel on the right grows with it. Both come from that one field.
There's also a Sort A–Z button on the card that rewrites the field, and the ports re-order to
follow it. Then wire the Webhook's payload into it.

**Filter** — set the condition to `contains` and the value to `refund`. Two output branches,
pass and fail. If I switch to a unary operator like "is empty", the value field vanishes —
nothing to compare against. Switch back. Wire JSON Parse's `message` into it.

**Input** — a manual entry point alongside the webhook. Rename it to `agent_name`, and watch
the outputs panel update live as I type.

**Text** — this is its own part of the brief so I'll come back to it, but quickly: type
`Ticket: {{ticket}}` and `Agent: {{agent}}` and you get two ports on the left, one per
variable. Wire Filter's pass branch into `ticket`, and the Input into `agent`.

**LLM** — two inputs, system and prompt. Tick "use personal API key" and a required password
field appears; untick it and it's gone. There's also a Reset instructions button. Wire the
Text output into the prompt.

**API Request** — set it to POST and give it a URL. If I type something that isn't a URL it
flags it inline. Two
output branches, ok and error. Wire the LLM response into the body.

**Two Outputs** — one called `crm_result` off the API's ok branch, one called `unmatched` off
the Filter's fail branch. The second one picks up `customOutput-2` automatically.

**Note** — drop one in the corner and type something. No header, no ports, no fields.

*[Fit view]*

And connections delete with the ✕ at the midpoint, no confirmation, since it's one drag to put
back. Nodes ask first, because deleting a node takes its connections with it.

---

## Task 4 — the backend

*[Click Submit]*

And submitting. Ten nodes, eight edges, and it is a DAG.

The brief says create an alert showing those values in a user-friendly way — so it's a proper
dialog rather than a `window.alert`. Three tiles and a plain-English reading of the result.

*[Close, then wire API Request's error branch back into JSON Parse, and submit again]*

Let me break it on purpose — route the error branch back into the parser. That's a retry loop,
which is a cycle. Submit, and now it's nine edges and `is_dag` is false.

---

## Wrapping up

Apart from that there's a decent test suite — 120 tests, 106 on the front end with Jest and
Testing Library and 14 on the backend with pytest. The one I'd point at is the registry test,
which loops every node config and checks it renders, exposes the handles it declared and
labels all its controls. That's what makes the abstraction provable rather than just claimed.

And there's documentation — a README with the reasoning behind the main decisions, plus docs
on the architecture, the features and the node config schema. Including a known limitations
section, because there are some real ones: no persistence or undo, light theme only, and the
field validation warns rather than blocks.

That's everything. Thanks for watching.

---

### Two corrections from your draft

- It's **JavaScript, not TypeScript** — Create React App, all `.js` files, no `tsconfig`.
  Worth getting right since it's the first claim in the video.
- The full blow-by-blow version with line numbers and exact timings is in
  [WALKTHROUGH_SCRIPT.md](WALKTHROUGH_SCRIPT.md) if you want it while rehearsing. This file is
  the one to actually read on camera.
