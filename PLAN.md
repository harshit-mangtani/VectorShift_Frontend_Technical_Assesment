# VectorShift Frontend Assessment — Implementation Plan

**Source of truth:** `VectorShift.md` — the official 4-part brief. `CLAUDE_SUGGESTIONS.md` is a generated implementation prompt, not a client requirement; it was mined for useful ideas, not treated as a spec (see *What was taken from it* below).

**Stack (locked):** React 18 + CRA via CRACO (keeps `npm start`) · Tailwind CSS v3 + `class-variance-authority` · Zustand · React Flow 11 · FastAPI + Pydantic v2 · Jest/RTL + pytest.

**Deliverable framing:** the brief has 4 parts, but they collapse into one system — a node registry that the toolbar, canvas, styling, text-variable logic, and submit payload all read from. Build that spine first; everything else hangs off it.

---

## What was taken from `CLAUDE_SUGGESTIONS.md`

Three items earned inclusion:

1. **The visual direction** (§2) — dark navy header, light neutral workspace, white cards, blue/purple accent, 8–12px radii. Concrete, matches the real product, and removes a design decision that would otherwise be a guess. Folded into Phase 2.
2. **State management as a first-class concern** (§4) — surfaced a real bug: the starter nodes hold field values in `useState` and never write to `node.data`, so the submit payload ships empty. Promoted to its own phase (Phase 4).
3. **The originality guard** (§2/§9) — build a recognisable visual relationship to VectorShift without copying logos, screenshots, or assets, and say so in the README.

Deliberately **not** adopted:

- *"Use CSS files or CSS modules"* — the real target of that line is inline-style soup (`style={{width: 200, border: '1px solid black'}}` in every starter node). Tailwind eliminates that more thoroughly, and `cva()` is a better fit for "apply styles across all nodes at once". One build-tool cost (CRACO). Record it in the README as a decision, not an oversight.
- *"No Redux, SSR, virtualization, or unnecessary dependencies"* — right in spirit, wrong in detail. `onlyRenderVisibleElements` is a one-line React Flow prop, not a virtualization library, and `source-map-explorer` is a dev-only tool that exists to produce one number for the perf doc. Both stay. The genuinely unnecessary deps (`tailwind-merge`, lazy-loading the MiniMap) were cut on their own merits.
- **The node type "Condition"** — Filter and Condition both demonstrate "branch on a predicate". In a set whose only job is showing range, that's a wasted slot. See 1.5.
- §5–§8 (backend behaviour, submit flow, perf techniques, test enumeration) — restate the brief or are strict subsets of what this plan already covers.

**Dependency budget** (each needs a one-line README justification): `@craco/craco`, `tailwindcss`, `postcss`, `autoprefixer` (build) · `class-variance-authority` + `clsx` (variant styling) · `lucide-react` (icons — tree-shakeable, and avoids shipping proprietary logo assets) · `source-map-explorer` (dev-only, perf measurement).

**Theming:** light theme is the deliverable. Author the palette as semantic tokens so dark mode is a later token swap, but don't spend QA time on two themes — it's a Phase 9 stretch goal, not a requirement.

---

## Requirements compliance matrix

Every line of `VectorShift.md`, mapped to where this plan satisfies it. Re-check this table before submitting.

| Brief requirement | Where | Status |
|---|---|---|
| JavaScript/React frontend | throughout | ✅ No TypeScript anywhere — the schema uses JSDoc typedefs in `.js` files to get editor typing without violating the constraint |
| Python/FastAPI backend | Phase 5.1 | ✅ |
| **Part 1** — abstraction that speeds up *creating* new nodes | Phase 1.1–1.4 (registry + `createNode`) | ✅ |
| **Part 1** — …*and applying styles across nodes* | Phase 2.3 (single `cva()` file) | ✅ Both halves; easy to answer only the first |
| **Part 1** — five new nodes "of your choosing" | Phase 1.5 | ✅ Selected for coverage, matching the brief's "showcase the flexibility/efficiency" framing over plausibility |
| **Part 2** — appealing, unified design | Phase 2 | ✅ |
| **Part 2** — "whatever React packages/libraries you like" | Phase 0.2 | ✅ Explicitly authorises the Tailwind/CRACO choice |
| **Part 3** — **width *and* height** grow with input | Phase 3.2 | ✅ Height from `scrollHeight`, width from measured longest line. Height-only is the common half-answer |
| **Part 3** — `{{ variable }}` creates a Handle **on the left side** | Phase 3.3 | ✅ Targets default to `Position.Left` in `NodeHandle` |
| **Part 3** — "valid JavaScript variable name" | Phase 3.1 | ✅ Incl. the brief's own `{{ input }}` spacing |
| **Part 4** — `submit.js` sends nodes + edges on click | Phase 5.2 | ⚠️ See non-negotiable #3 |
| **Part 4** — `/pipelines/parse` in `main.py` counts nodes/edges + DAG check | Phase 5.1 | ⚠️ See non-negotiable #4 |
| **Part 4** — response is exactly `{num_nodes, num_edges, is_dag}` | Phase 5.1 | ✅ No extra keys, no renaming, no envelope |
| **Part 4** — alert displaying all three values, user-friendly | Phase 5.2 | ✅ Styled modal; README states this is the required alert |
| **Part 4** — end-to-end: build pipeline → submit → see result | Phase 9.2 items 10–12 | ✅ |

### Four non-negotiables the plan must not break

These are the brief's literal operating instructions. Violating any one makes the submission look broken regardless of code quality.

1. **`cd frontend && npm i && npm start` must work on a clean clone**, exactly as written. Adding CRACO introduces peer-dependency risk with `react-scripts@5` — if `npm i` needs `--legacy-peer-deps`, the requirement is broken. **Gate:** clone to a fresh directory, delete `node_modules`, run the two commands verbatim, confirm the app boots. If it doesn't resolve cleanly, drop Tailwind for CSS Modules rather than add an install flag. *The styling approach is negotiable; the install command is not.*
2. **`cd backend && uvicorn main:app --reload` must work**, exactly as written. `app` stays importable from `main`. Add `requirements.txt` as a convenience, never as a precondition the brief doesn't mention.
3. **`submit.js` stays the submit implementation.** The brief names the file. The Submit button may *render* in the header, but `src/submit.js` must remain the module that owns the handler and the API call — don't scatter it into `components/` and leave a stub behind.
4. **The endpoint stays defined in `main.py`.** The brief says "update the `/pipelines/parse` endpoint in `/backend/main.py`". Extract the pure DAG function to `dag.py` and the schemas to `models.py`, but the route decorator itself lives in `main.py`. Do **not** move it into a `routers/` package — the reviewer opens `main.py` first.

---

## Phase 0 — Baseline, tooling, and bug triage

**Goal:** clean, reproducible, lint-clean starting point before any feature code.

### 0.1 Repo hygiene
- [ ] `git init` is already done here, but the repo has **no commits yet** and the parent directory `C:\Users\Harshit` is itself a git repo. Confirm you're committing to the local repo, then make an initial "starter code" commit **before** touching anything — the diff is part of what a reviewer reads.
- [ ] Root `.gitignore`: `node_modules/`, `build/`, `__pycache__/`, `.venv/`, `.DS_Store`, `.env*`, `coverage/`, `.pytest_cache/`.
- [ ] Delete the `.DS_Store` files (root + `frontend/`).

### 0.2 Frontend toolchain
- [ ] `cd frontend && npm i`
- [ ] `npm i -D tailwindcss@3 postcss autoprefixer @craco/craco` · `npm i class-variance-authority clsx lucide-react`
  - CRA 5 does **not** read a standalone `postcss.config.js` — that's why CRACO is required. Swap the four `package.json` scripts from `react-scripts` → `craco`. `npm start`, `npm test`, and `npm run build` keep working exactly as both spec files require.
  - `npx tailwindcss init -p`; `content: ['./src/**/*.{js,jsx}']`.
- [ ] Add `eslint` + `prettier` + `eslint-plugin-jsx-a11y`; `.eslintrc.json` extending `react-app`; scripts `lint`, `lint:fix`, `format`, `test:ci` (`CI=true craco test --coverage --watchAll=false`).
- [ ] **Watch item:** Node v22 + `react-scripts@5` — if the dev server throws an OpenSSL `digital envelope` error, the fix is `NODE_OPTIONS=--openssl-legacy-provider` (via `cross-env` for Windows), not a Node downgrade.

### 0.3 Backend toolchain
- [ ] Local Python is **3.8.10** (EOL), which constrains versions. `backend/requirements.txt`:
  ```
  fastapi==0.111.0
  uvicorn[standard]==0.30.1
  pydantic==2.7.4
  pytest==8.2.2
  httpx==0.27.0
  ```
  If resolution fights you, upgrade to Python 3.11 and drop the pins. Record whichever route you took in the README.
- [ ] `python -m venv .venv` in `backend/`, install, confirm `uvicorn main:app --reload` serves `GET /`.

### 0.4 Pre-existing bugs (fix these, and put the table in the README — free credibility)
| File | Bug | Fix |
|---|---|---|
| [package.json](frontend/package.json) | **`zustand` is a phantom dependency.** [store.js:3](frontend/src/store.js#L3) imports it, but it's not declared — it only resolves because `reactflow` hoists it (4.4.1 per the lockfile). A different resolution on a clean install breaks the app, and the resolved version decides whether the `useStore(selector, shallow)` signature at [ui.js:38](frontend/src/ui.js#L38) is even valid (removed in zustand v5 in favour of `useShallow`). | Declare `zustand@^4.4.1` explicitly |
| [inputNode.js:8-9](frontend/src/nodes/inputNode.js#L8-L9), [outputNode.js:8-9](frontend/src/nodes/outputNode.js#L8-L9), [textNode.js:7](frontend/src/nodes/textNode.js#L7) | **Field values live only in `useState`** — they never reach `node.data`, so the submit payload silently omits everything the user typed | Commit to the Zustand store (Phase 4) |
| [ui.js:96](frontend/src/ui.js#L96) | `width: '100wv'` — invalid CSS unit, silently ignored | `100%` inside a flex layout |
| [store.js:44-52](frontend/src/store.js#L44-L52) | `updateNodeField` **mutates** `node.data` and returns the same object reference — React Flow can skip re-renders | return a new node object |
| [store.js:11](frontend/src/store.js#L11) | `getNodeID` reads `get().nodeIDs`, but `nodeIDs` is never initialised in state | initialise `nodeIDs: {}` |
| [ui.js:70](frontend/src/ui.js#L70) | `reactFlowInstance.project()` deprecated in RF11 | `screenToFlowPosition()` |
| [ui.js:83](frontend/src/ui.js#L83) | `onDrop` `useCallback` deps omit `getNodeID`/`addNode` — stale closure | complete the dep array |
| [llmNode.js:12-18](frontend/src/nodes/llmNode.js#L12-L18) | Handle positions hand-tuned as `100/3`, `200/3` — unmaintainable per node | auto-distribute in `NodeHandle` |
| [main.py:9](backend/main.py#L9) | `GET` endpoint declaring a `Form(...)` body — cannot work as written | `POST` + Pydantic model |

### 0.5 Clean-clone gate (do this the moment CRACO is wired, not at the end)
The brief's operating instructions are `npm i` then `npm start`. Adding CRACO puts that at risk, and finding out on submission day is fatal.
- [ ] Copy the repo to a fresh directory, delete `node_modules` and leave `package-lock.json` in place.
- [ ] Run `npm i` **with no flags** — no `--legacy-peer-deps`, no `--force`. If it ERESOLVEs against `react-scripts@5`, abandon Tailwind for CSS Modules rather than document a workaround flag. The styling stack is negotiable; the install command isn't.
- [ ] Run `npm start`, confirm the app boots.
- [ ] Separately: `cd backend && uvicorn main:app --reload` from a clean shell.

**Exit criteria:** `npm start` renders the original app, `npm run lint` clean, `uvicorn` serves, `pytest` collects without error, clean-clone gate passed, starter commit in place.

---

## Phase 1 — Node Abstraction (Brief Part 1)

**Goal:** adding a node type is *one config object in one file* — no toolbar edit, no `nodeTypes` edit, no styling edit.

### 1.1 Schema
`src/nodes/core/types.js`, JSDoc typedefs (plain JS, but typed for editor support):

```js
/**
 * @typedef {Object} FieldConfig
 * @property {string} key                 // persisted into node.data
 * @property {'text'|'textarea'|'select'|'number'|'checkbox'} type
 * @property {string} label
 * @property {*} [defaultValue]           // value | (id, data) => value
 * @property {Array<{label,value}>} [options]
 * @property {(data) => boolean} [visibleIf]    // conditional fields
 * @property {(v) => string|null} [validate]
 * @property {{min?:number,max?:number,step?:number}} [numeric]
 */

/**
 * @typedef {Object} HandleConfig
 * @property {'source'|'target'} type
 * @property {string} id                  // suffix; final id = `${nodeId}-${id}`
 * @property {'left'|'right'|'top'|'bottom'} [position]
 * @property {string} [label]             // rendered beside the port
 */

/**
 * @typedef {Object} NodeConfig
 * @property {string} type                // react-flow nodeTypes key
 * @property {string} label
 * @property {string} [description]       // optional sub-title line in the card header
 * @property {React.ComponentType} icon
 * @property {'io'|'llm'|'logic'|'data'|'utility'} category   // drives accent + toolbar grouping
 * @property {FieldConfig[]} [fields]
 * @property {HandleConfig[]|((data) => HandleConfig[])} handles   // fn ⇒ dynamic ports
 * @property {React.ComponentType} [render]   // escape hatch for bespoke bodies
 * @property {{minWidth?:number,maxWidth?:number,minHeight?:number}} [size]
 */
```

Two load-bearing choices: **`handles` may be a function of `data`** — this is what makes Part 3's dynamic variable ports fall out of the abstraction instead of being bolted on; and **`render` is an optional escape hatch** so the abstraction never becomes a straitjacket.

### 1.2 Primitives
- [ ] `core/BaseNode.jsx` — card shell: header (icon + title + category badge), optional description line, body (auto-rendered fields or custom `render`), selection ring, invalid state.
- [ ] `core/fields/` — `TextField`, `TextAreaField`, `SelectField`, `NumberField`, `CheckboxField`. Each: local state + debounced store commit (Phase 4), real `<label htmlFor>`, `aria-invalid`, visible focus ring, `nodrag` class so dragging inside a field doesn't move the node.
- [ ] `core/NodeHandle.jsx` — wraps RF `<Handle>`; **auto-distributes vertically** (`top: (i+1)/(n+1)`), renders the port label, `nodrag`/`nopan` guards, hit target larger than the visual dot.
- [ ] `core/createNode.js` — `createNode(config)` → memoized RF component. Resolves defaults into `data` on mount, reads/writes through the store, calls `useUpdateNodeInternals` when the handle set changes.

### 1.3 Registry (single source of truth)
- [ ] `src/nodes/registry.js` exports `nodeConfigs`, `nodeTypes` (built once at module scope), and `toolbarGroups` (grouped by `category`).
- [ ] Rewrite [toolbar.js](frontend/src/toolbar.js) and [ui.js](frontend/src/ui.js) to consume it — **zero hardcoded node names anywhere in the app.**

### 1.4 Port the four originals
- [ ] `input.config.js`, `output.config.js`, `llm.config.js`, `text.config.js` — ~15–30 lines each. Keep the RF type keys (`customInput`, `llm`, `customOutput`, `text`).

### 1.5 The five new nodes
The brief says "five new nodes of your choosing" and "showcase the flexibility/efficiency of your node abstraction" — so the selection criterion is **coverage, not plausibility**. Each node is assigned one capability no other node demonstrates:

| Node | Category | Capability it proves |
|---|---|---|
| **Filter** | logic | **Multiple source handles** (`true` / `false`) + **conditional fields** — `visibleIf` hides the comparison value for `is empty` / `is not empty` |
| **Transform** | utility | **Dynamic handles** — reuses the Phase 3 `{{variable}}` engine in a template field, proving the text-node logic is a shared capability rather than a one-off |
| **API Request** | data | **Field validation** — method select, URL with format validation, JSON headers/body textarea with parse validation, numeric timeout with min/max |
| **Database** | data | **Field-driven topology** — query textarea, numeric limit, and a read/write select that *changes the handle set*, plus grouped/labelled ports |
| **Sticky Note** | utility | **The degenerate case** — zero handles, no header, custom `render`. Proves the abstraction has an escape hatch and doesn't force a shape. |

*Dropped: a separate "Condition" node.* It and Filter both demonstrate branching on a predicate; carrying both spends a slot without adding coverage. Filter absorbs the two-output behaviour.

Every node must be registered in `nodeTypes`, present in the toolbar, draggable, render correctly, expose useful handles, store editable values in `node.data`, and receive a unique generated ID. The registry gives all seven for free — that's the point of Phase 1, and 7.3 tests it as a property of the registry rather than node by node.

**Exit criteria:** a reviewer can add a node by writing one config file and adding one import. State that claim in the README, and make the registry-loop test (7.3) prove it.

---

## Phase 2 — UI & Styling (Brief Part 2)

**Goal:** an enterprise workflow-builder that looks shipped. The visual direction below is fixed up front so styling decisions don't get relitigated per component.

### 2.1 Tokens (`tailwind.config.js`)
Encode the specified direction as semantic tokens, not raw hex at call sites:
- [ ] `header` — dark navy/charcoal · `canvas` — light neutral · `surface` — white cards · `border` — subtle · `text-primary` / `text-muted`
- [ ] Primary accent: **blue or purple**; one category accent each for `io` / `llm` / `logic` / `data` / `utility` (used for the left accent bar + toolbar badge)
- [ ] Radii **8–12px** (`rounded-lg` / `rounded-xl`), a 2-step shadow scale, 4px spacing rhythm, clear type scale
- [ ] Author tokens so dark mode is a later swap, but **ship light only** (see Open conflict #2)

### 2.2 Layout shell
- [ ] `components/AppShell.jsx` — dark navy header (wordmark + Submit), left node-library sidebar (grouped by category, collapsible, searchable), full-bleed canvas. Flex, `100dvh`, no page scroll. Responsive for laptop/desktop widths (the spec's stated target — don't sink time into mobile).
- [ ] Canvas: dotted `<Background>`, styled `<Controls>`, `<MiniMap>` colouring nodes by category from the registry, empty state ("Drag a node from the library to begin") that clears on first drop.

### 2.3 Node visuals via CVA
- [ ] `core/nodeVariants.js` — a single `cva()` owning category × selected × invalid × dragging. **One file restyles every node** — that is Part 1's "apply styles across nodes" requirement made literal.
- [ ] Edges: styled `smoothstep` + arrow markers, hover highlight, delete-on-hover control. **Default `animated: false`** (see 6.3).
- [ ] Handles: colour-coded by direction, grow on hover, matching `connectionLineStyle`.

### 2.4 Interaction states
- [ ] Hover / focus / disabled / loading states for every interactive element — buttons, fields, selects, draggable library items, Submit.
- [ ] Drag preview: a ghost card matching the real node, not the browser default.
- [ ] **Click-to-add** as well as drag — drops at viewport centre. Drag-only is a keyboard dead end.

### 2.5 Motion & a11y
- [ ] Node mount transition, toast slide-in — all behind `@media (prefers-reduced-motion: reduce)`.
- [ ] Tab reaches every field; `Delete` removes selection; `Cmd/Ctrl+Enter` submits; focus-visible rings throughout.
- [ ] Run axe DevTools, target zero critical violations, record the result.

### 2.6 Originality guard
- [ ] Original markup, styling, icons (`lucide-react`), and layout. **No** VectorShift logos, screenshots, illustrations, or copied screens. Add a short README paragraph: visual direction inspired by VectorShift's public product aesthetic; implementation and assets original.

---

## Phase 3 — Text Node Logic (Brief Part 3)

### 3.1 Variable parser (a standalone utility, tested independently of the component)
- [ ] `src/lib/parseVariables.js`:
  ```js
  const VAR_RE = /\{\{\s*([A-Za-z_$][A-Za-z0-9_$]*)\s*\}\}/g;
  ```
  - **Valid:** `{{input}}`, `{{name}}`, `{{user_name}}`, `{{value2}}`, `{{$value}}`, and `{{ input }}` — padding whitespace is trimmed. (The suggestions' "ignore whitespace-containing names" means `{{user name}}`, not padded braces. Worth a test asserting both readings.)
  - **Invalid:** `{{user name}}`, `{{user-name}}`, `{{2value}}`, `{{}}`, unterminated `{{`, and JS reserved words/literals (`class`, `if`, `true`, `null`).
  - Preserve **first-appearance order**, dedupe, handle `{{a}}{{b}}` adjacency.
  - Return `{ variables, invalid }` so the UI can surface a subtle warning for `{{2bad}}` rather than silently dropping it.

### 3.2 Auto-resize
- [ ] Replace the single-line `<input>` with a `<textarea>` — the brief's "height grows as the user enters more text" is only meaningful for multiline content.
- [ ] `src/hooks/useAutosize.js` — height from `scrollHeight` (reset to `auto` first); width from the longest line measured on a **module-level cached canvas 2D context** with the resolved font, not DOM reflow.
- [ ] Clamp to sensible min/max; the textarea scrolls past max instead of growing forever. rAF-throttle writes. Measure on `input`, not every render.
- [ ] Text persists in `node.data` (Phase 4), not local state only.

### 3.3 Dynamic handles
- [ ] `text.config.js`: `handles: (data) => [...parseVariables(data.text).variables.map(v => ({type:'target', id:v, label:v})), {type:'source', id:'output'}]` — output handle on the right always preserved.
- [ ] Stable handle IDs (`${nodeId}-${varName}`); vertical distribution comes free from `NodeHandle`.
- [ ] Call `useUpdateNodeInternals(id)` **only when the joined handle-id list actually changes** — every-keystroke calls cause measurable layout thrash.
- [ ] **The trap neither spec mentions:** React Flow does *not* delete edges when a handle disappears. Delete `{{input}}` and a dangling edge remains, pointing at a port that no longer exists — which then inflates `num_edges` and can fabricate a false cycle in the Part 4 DAG check. Add a store action `syncNodeHandles(nodeId, validTargetIds)` that prunes orphaned edges, and test it. This is a genuine data-integrity bug, and it's the single most differentiating item in this plan.
- [ ] Feed handle count into min-height so N variables get N legible slots.

### 3.4 Reuse
- [ ] The **Transform** node (1.5) uses the same variable engine via ~2 config lines. Call this out in the README — it converts Part 3 from a feature into evidence for Part 1.

---

## Phase 4 — State Management & Data Integrity

The brief never asks for this explicitly, which is exactly why it's worth a phase: Part 4 quietly depends on it. If field values never reach `node.data`, the pipeline you submit isn't the pipeline on screen.

- [ ] **Kill local-only state.** Every field value lives in `node.data`. Local `useState` exists *only* as a debounce buffer, never as the source of truth.
- [ ] **Immutability.** `updateNodeField` returns new node *and* new `data` objects; never mutate. Same for edges.
- [ ] **Surgical updates.** Editing a field must produce a new object for that node only — every other node keeps its reference so `React.memo` holds. Test this directly by asserting object identity of untouched nodes.
- [ ] **Narrow selectors.** Nodes subscribe to their own slice: `useStore(s => s.nodes.find(n => n.id === id)?.data, shallow)` — never the whole `nodes` array.
- [ ] **Unique IDs.** Fix the uninitialised `nodeIDs`; guarantee uniqueness across type churn and deletions (a monotonic counter per type, never reusing a freed number).
- [ ] **Deletion still works.** Removing a node must also remove its incident edges; verify RF's change handlers still function after the refactor.
- [ ] **Latest data at submit — the debounce hazard.** With a ~150ms debounce, clicking Submit immediately after typing sends *stale* data. Fix by either flushing all pending debounces before serialisation, or committing on blur *and* treating the Submit click as a blur. Both specs demand "the latest node data is available during submission"; this is exactly how that requirement gets violated in practice. Cover it with a test that types and submits with no intervening delay.

---

## Phase 5 — Backend & Submit Flow (Brief Part 4)

### 5.1 Backend
- [ ] `backend/models.py` — Pydantic v2 `Node`, `Edge`, `Pipeline`, `ParseResponse`. `model_config = ConfigDict(extra='ignore')` so React Flow's extra fields don't 422 the request.
- [ ] `backend/dag.py` — `is_dag(nodes, edges)` via **iterative Kahn's algorithm**, O(V+E). Iterative rather than recursive DFS: a deep pipeline would otherwise hit Python's recursion limit. Handles self-loops, parallel edges, and edges referencing unknown node IDs (ignore, don't crash).
- [ ] `backend/main.py` — `POST /pipelines/parse` returning exactly `{num_nodes, num_edges, is_dag}`; `CORSMiddleware` scoped to `http://localhost:3000` (explicit origin, not `*`); keep `GET /` as healthcheck; structured errors for malformed bodies.
- [ ] Required behaviours: empty graph → DAG · single node → DAG · linear → DAG · branching → DAG · merging → DAG · cycle → not DAG · self-loop → not DAG.
- [ ] **The route decorator stays in `main.py`** (non-negotiable #4) — only the pure DAG function and the schemas move out. `uvicorn main:app --reload` must keep working verbatim from `/backend`.

### 5.2 Frontend submit
- [ ] `src/lib/api.js` — `parsePipeline(nodes, edges)` with `AbortController` timeout, typed errors (`NetworkError`, `ApiError`), `REACT_APP_API_URL` defaulting to `http://localhost:8000`, plus `.env.example`.
- [ ] Serialise a **clean** payload: strip RF internals (`positionAbsolute`, `width`, `height`, `selected`, `dragging`); send `{id, type, data}` and `{id, source, target, sourceHandle, targetHandle}`. Makes the contract explicit and the payload small.
- [ ] Rewrite [submit.js](frontend/src/submit.js): read latest state from Zustand (flushing debounces per Phase 4), POST JSON, loading state, **guard against duplicate submits while pending**, empty-pipeline guard, distinct handling for network failure vs non-2xx.
- [ ] **`submit.js` remains the owner of the submit logic** (non-negotiable #3). The brief names this file. Rendering the button inside the header shell is fine; leaving a stub here while the real handler lives in `components/` is not.
- [ ] **The alert.** The brief says "create an alert … in a user-friendly manner", which a styled dialog serves better than `window.alert`. Result modal with three stat tiles (Nodes / Connections / DAG) and plain-English copy:
  > Pipeline analyzed successfully. · Nodes: 5 · Connections: 4 · Directed acyclic graph: Yes
  When `is_dag` is false, add the *why it matters* line ("This pipeline contains a cycle and can't be executed"). `role="dialog"`, focus trap, Esc to dismiss. State in the README that this **is** the required alert — so the deviation reads as a deliberate upgrade rather than a missed requirement.

---

## Phase 6 — Performance

Measure, fix, record. Everything here is zero-runtime-dependency or dev-only.

**There are three hot paths in a React Flow app, not one.** Typing is the obvious one; node *dragging* fires at ~60fps and is just as expensive; and *connecting* re-renders edges per mousemove. Optimising only the first is the common half-job.

### 6.1 Baseline — get the methodology right or the numbers are fiction
- [ ] **Profile a production build, not `npm start`.** Dev builds are unoptimised and `React.StrictMode` double-invokes every render — baseline numbers from the dev server overstate everything and make the "after" look better than it is. Use `npm run build` with a profiling build (`--profile`) and React DevTools.
- [ ] Scenario A — **typing**: 20 characters into a Text node on a ~40-node graph. Record commit count and total render ms.
- [ ] Scenario B — **dragging**: drag one node across the canvas for ~2s on the same graph. Record commits and dropped frames from the Performance panel.
- [ ] Scenario C — **scale**: 300 nodes / 300 edges, pan and zoom. Record FPS.
- [ ] `npm i -D source-map-explorer`, add an `analyze` script, record starting bundle size.
- [ ] **Wire up `web-vitals`** — already a dependency and currently unused. Report **INP** (the interaction metric that actually matters for a canvas app) to the console in dev. Nearly free, and it turns "feels smooth" into a number.

### 6.2 The typing path
- [ ] Debounced field commits (~150ms) so a keystroke doesn't touch the store — *the single biggest win*; currently every character re-renders the entire graph. (Flush before submit — see Phase 4.)
- [ ] `React.memo` on node components, comparator on `data`/`selected` only, applied centrally in `createNode`.
- [ ] **Memoize individual field components** so editing one field doesn't re-render its siblings inside the same node.
- [ ] `useMemo` for derived Text-node variables; `useCallback` for handlers with correct deps.
- [ ] Cached module-level canvas 2D context for text measurement; rAF-throttled autosize writes (Phase 3.2).
- [ ] `useUpdateNodeInternals` only when the handle-id list actually changes (Phase 3.3).

### 6.3 The drag path *(missing from most submissions)*
- [ ] `applyNodeChanges` returns a **new `nodes` array on every mousemove**. Any component subscribing to the whole array re-renders ~60×/sec for the entire drag. Audit every `useStore` call site for whole-array subscriptions — this is the single highest-value audit in the phase.
- [ ] The memo comparator must **exclude `position`**. React Flow applies position via a CSS transform on the wrapper; the node *body* has no reason to re-render as it moves. Getting this wrong re-renders the dragged node's entire subtree every frame.
- [ ] **The Submit button must read state non-reactively** — `useStore.getState()` inside the click handler, not a subscription. Subscribed, it re-renders on every drag frame for data it only needs once.
- [ ] Memoize any custom edge component; edges recompute their path on each connected-node move.

### 6.4 Canvas & CSS
- [ ] **Default `animated: false` on edges** — each animated edge is a running CSS animation; past ~100 edges it dominates the frame budget. Enable only for the selected path.
- [ ] `elevateNodesOnSelect`, sensible `minZoom`/`maxZoom`.
- [ ] `onlyRenderVisibleElements` — a built-in prop, not a virtualization library. Measure on and off with Scenario C; keep the winner and report both numbers.
- [ ] `contain: layout paint` on node cards so one node's reflow can't invalidate the canvas. Cheap; measurable at 300 nodes.
- [ ] Verify Tailwind's purge keeps the emitted CSS small (target < ~15KB gzipped) and that no dynamically-concatenated class strings defeat content scanning.

### 6.5 Re-measure & write it up
- [ ] Re-run all three scenarios; before/after table in `docs/PERFORMANCE.md` including the bundle delta and INP.
- [ ] **Document what you rejected and why** — this reads as judgment, not omission:
  - *Normalizing the store to a `Map`* — `nodes.map()` is O(n) per update, but debouncing already caps that at ~7/sec; normalization adds real complexity to every RF integration point for no measurable gain at this scale.
  - *Redux* — Zustand already fits; migrating buys nothing.
  - *SSR* — no server-render requirement exists.
  - *Route-level code splitting / lazy MiniMap* — single-route app; the split costs a waterfall and saves nothing meaningful.
  - *Windowing the node library sidebar* — nine items.

---

## Phase 7 — Tests

### 7.1 Setup
- [ ] `src/setupTests.js`: `@testing-library/jest-dom` plus the React Flow polyfills that are otherwise a silent multi-hour sink — `ResizeObserver`, `DOMMatrixReadOnly`, `Element.prototype.getBoundingClientRect`, and `HTMLCanvasElement.prototype.getContext` (needed by the autosize measurer). Without these, every RF render test fails with zero-dimension errors.
- [ ] Coverage thresholds in `package.json` (~70% statements; `lib/` and `store` higher). Keep tests deterministic; mock only `fetch`.

### 7.2 Unit
| File | Covers |
|---|---|
| `parseVariables.test.js` | all five valid forms from the spec incl. `{{$value}}`; padded `{{ input }}` valid vs `{{user name}}` invalid; hyphenated; digit-leading; `{{}}`; unterminated; reserved words; dedupe; **first-appearance ordering**; adjacency; the `invalid` return list |
| `store.test.js` | `getNodeID` uniqueness per type and across deletions; `addNode`; `updateNodeField` returns new objects **and leaves other nodes referentially identical**; edge removal on node delete; `syncNodeHandles` prunes orphaned edges |
| `payload.test.js` | serialiser strips RF internals, preserves handle IDs, reflects latest (flushed) data |

### 7.3 Component / integration
| File | Covers |
|---|---|
| `registry.test.js` | **Loop over every config** — each renders, exposes its declared handle IDs, and has a labelled control per field. One test protecting all nine nodes; the strongest available evidence the abstraction is real. |
| `TextNode.test.js` | textarea grows with content and stops at max; `{{a}} {{b}}` → two target handles in order; repeated `{{a}}` → one handle; `{{2x}}` → no handle; deleting `{{a}}` removes the handle **and prunes its edge**; output handle always present |
| `FilterNode.test.js` | both source handles (`true`/`false`) render; `visibleIf` shows/hides the comparison field per operator |
| `DatabaseNode.test.js` | switching read→write changes the handle set and calls `useUpdateNodeInternals` |
| `fieldUpdates.test.js` | editing text/select/number/checkbox writes through to `node.data` |
| `Toolbar.test.js` | one entry per registry config; click-to-add inserts a node with a unique ID |
| `submit.test.js` | correct URL/method/JSON body; loading state; duplicate-submit prevention; success modal shows all three values; `is_dag: false` copy; network error; non-2xx error; **type-then-immediately-submit sends the fresh value** (the Phase 4 debounce hazard) |

### 7.4 Backend (pytest + `TestClient`)
| File | Covers |
|---|---|
| `test_dag.py` | empty · single node · linear · branching · merging · diamond (DAG despite reconvergence) · self-loop · 2-cycle · long cycle · cycle in one of two disconnected components · duplicate edges · edge referencing a missing node · large graph completes fast |
| `test_api.py` | response shape and types; correct counts; correct `is_dag`; unknown extra node fields don't 422; malformed body → 422; empty pipeline; CORS preflight headers; `GET /` health |

### 7.5 CI (optional)
- [ ] `.github/workflows/ci.yml` running lint → test → build → pytest. Even unrun, it documents the verification story.

---

## Phase 8 — Documentation

- [ ] **`README.md` (root)** — the primary artifact a reviewer reads. Screenshot/GIF at top. Sections: project overview · frontend install & start · backend install & start · how to use the builder · **how to add a node** · the shared node abstraction · dynamic Text variables · backend endpoint & response format · frontend test command · backend test command · production build command.
  Plus: the Phase 0.4 bug table, key decisions with trade-offs (including the Tailwind-vs-CSS-Modules call and the new-dependency justifications), performance before/after, known limitations, "what I'd do with another day".
- [ ] **The originality paragraph**: visual direction inspired by VectorShift's public product aesthetic; markup, styling, icons, and layout original; no proprietary assets used.
- [ ] **`docs/NODE_ABSTRACTION.md`** — the money document. "Add a node in 20 lines": annotated config, full field/handle schema reference, when to reach for `render`, and a walkthrough of how **Transform** gets dynamic ports for free.
- [ ] **`docs/ARCHITECTURE.md`** — data flow (drag → store → RF → submit → FastAPI), store shape, selector strategy, the frontend↔backend payload contract.
- [ ] **`docs/DESIGN_SYSTEM.md`** — tokens, category accents, interaction states, a11y commitments + axe result.
- [ ] **`docs/PERFORMANCE.md`** — methodology, before/after table, what was rejected and why.
- [ ] **`backend/README.md`** — endpoints, schemas, why Kahn's, complexity, how to run tests.
- [ ] JSDoc on every export in `lib/` and `nodes/core/`. Comments explain *why*, not *what*.

---

## Phase 9 — Verification & final pass

### 9.1 Commands
```bash
cd frontend && npm install && npm run build && npm test -- --watchAll=false && npm run lint
cd ../backend && python -m compileall . && pytest -q
```

### 9.2 Manual checklist
1. [ ] All four original nodes drag onto the canvas
2. [ ] All five new nodes drag onto the canvas
3. [ ] Nodes connect
4. [ ] Node fields update correctly
5. [ ] Text node resizing works
6. [ ] Valid variables create handles
7. [ ] Repeated variables create one handle
8. [ ] Invalid variables are ignored
9. [ ] Removed variables remove handles **and their connected edges**
10. [ ] Linear pipelines return `is_dag: true`
11. [ ] Cyclic pipelines return `is_dag: false`
12. [ ] Submission errors display clearly *(test with the backend stopped)*
13. [ ] Frontend builds successfully, zero warnings
14. [ ] All tests pass

### 9.3 Wrap
- [ ] Also check: page reload, keyboard-only operation, ~300 nodes, laptop and desktop widths.
- [ ] 60–90s screen capture of the full flow, linked from the README.
- [ ] Small conventional commits, roughly one per phase — the history is itself evaluated.
- [ ] Final summary: files changed · features implemented · tests added · verification commands run · remaining limitations.
- [ ] *Stretch, only if everything above is green:* dark mode, undo/redo, pipeline save/load to `localStorage`.

---

## Order & effort

| Phase | Est. | Notes |
|---|---|---|
| 0 — Tooling & bug triage | 1.5h | Everything downstream depends on it |
| 1 — Node abstraction | 4h | Highest weight. Settle the schema before writing nodes. |
| 2 — Styling | 3.5h | Tokens can land early, in parallel with 1 |
| 3 — Text node | 2.5h | Edge-pruning is the subtle part |
| 4 — State management | 1.5h | Small but high-risk; the debounce/submit interaction bites late |
| 5 — Backend & submit | 2h | Straightforward once the payload contract is fixed |
| 6 — Performance | 2h | Three hot paths to measure (type / drag / scale), not one |
| 7 — Tests | 3h | Write `parseVariables` and `dag` tests *during* their phases |
| 8 — Docs | 2h | Draft as you go; this slot is polish |
| 9 — Verification | 1h | |

**Critical path:** Phase 1's schema. If `handles` isn't a function of `data` from day one, Phase 3 becomes a special case and Transform's reuse story evaporates.

### If time runs short, cut in this order

The brief grades four parts. Everything beyond them is additive, and additive work must never eat the graded work. Sacrifice from the bottom:

1. Dark mode, undo/redo, save/load *(already stretch)*
2. The CI workflow file, the screen capture
3. `docs/PERFORMANCE.md` scenarios B and C — keep A, keep the table
4. `docs/DESIGN_SYSTEM.md` and `docs/ARCHITECTURE.md` — fold the essentials into the README
5. Component tests for individual nodes — **keep `registry.test.js`**, which covers all nine at once
6. Phase 6 §6.4 canvas polish

**Never cut:** the registry (Part 1), the `cva` styling file (Part 1's second half), width *and* height autosizing (Part 3), variable handles on the left (Part 3), the exact response shape (Part 4), the alert (Part 4), `parseVariables.test.js`, `test_dag.py`, and the README. Those are the deliverable.

**What separates a strong submission here:**
1. The registry genuinely eliminating boilerplate — provable by the loop-over-registry test, not just claimed in prose.
2. Pruning orphaned edges when variable handles vanish. Neither spec mentions it; almost nobody does it; it silently corrupts the Part 4 DAG result.
3. Flushing debounced state before submit — the failure mode that makes "latest data at submission" quietly untrue.
4. Quantified performance numbers, and naming what you deliberately *didn't* optimise.
