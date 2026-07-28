# Claude Code Implementation Prompt

Copy the prompt below into Claude Code from the repository root.

```text
You are working on a frontend technical assessment in the current repository.

First inspect the repository and read:

- The provided assessment instructions file in the repository root
- frontend/package.json
- frontend/src/*
- frontend/src/nodes/*
- backend/main.py
- frontend/README.md

Do not delete or overwrite useful existing work without inspecting it first. Preserve the existing project setup where practical. You may add, modify, or reorganize files as needed.

Implement, test, polish, and verify the complete React + React Flow frontend and FastAPI backend.

The final result must be a polished node-based workflow builder.

==================================================
1. NODE ABSTRACTION
==================================================

Create a reusable shared React Flow node abstraction that handles:

- Node container/card
- Header and title
- Optional description
- Input handles
- Output handles
- Handle labels
- Common styling
- Node-specific children/content
- Optional configuration fields
- Flexible dimensions

Create an abstraction such as BaseNode, NodeShell, or an equivalent reusable component.

Refactor the existing Input, Output, LLM, and Text nodes to use it.

Add five additional node types:

- Filter
- Transform
- API Request
- Database
- Condition

These nodes should demonstrate different combinations of input handles, output handles, text fields, select fields, boolean fields, numeric fields, multiple outputs, and descriptions.

Every node must:

- Be registered in React Flow nodeTypes
- Be available in the toolbar
- Be draggable onto the canvas
- Render correctly
- Have useful handles
- Store editable values in Zustand node data
- Receive a unique generated ID

Use a node registry/configuration approach where helpful so future nodes can be added easily.

==================================================
2. UI AND STYLING
==================================================

Create an original, polished enterprise workflow-builder interface inspired by VectorShift’s product and public website.

The interface should feel visually aligned with VectorShift: a professional AI workflow platform centered around modular nodes, pipelines, connected data flows, and no-code workflow composition.

Use this visual direction:

- Dark navy application header
- Light neutral workspace background
- White node cards
- Subtle borders and shadows
- Blue or purple primary accent
- Muted secondary text
- Rounded corners around 8–12px
- Clear typography
- Consistent spacing
- Strong hover, focus, disabled, and loading states
- Small category accents or badges
- Clearly visible handles and connections

Use VectorShift-inspired visual cues where appropriate:

- Dark navy or charcoal header areas
- Light neutral workspace surfaces
- Blue/purple accent colors
- Clean white cards
- Restrained enterprise SaaS styling
- Generous whitespace
- Clear hierarchy and typography
- Subtle borders, shadows, and rounded corners

Improve the application header, toolbar/node library, draggable node buttons, main canvas, node cards, node headers, node descriptions, inputs, selects, Textarea styling, React Flow controls, MiniMap, canvas background/grid, edges, arrow markers, Submit button, loading state, error state, empty-canvas state, and result dialog or alert.

Use CSS files or CSS modules instead of excessive inline styling.

Make the layout responsive for normal laptop and desktop sizes. Fix obvious starter issues, including invalid dimensions such as `100wv` if present.

Try to style the application similarly to VectorShift’s current public product aesthetic, especially its clean workflow-builder and enterprise AI-platform feel. Do not copy exact screens, proprietary logos, illustrations, screenshots, or assets. Use original markup, styling, icons, and layout while maintaining a recognizable visual relationship to the reference product.

==================================================
3. TEXT NODE FUNCTIONALITY
==================================================

Replace the Text node’s single-line input with a multiline textarea or equivalent editor.

The node must grow wider for long lines where appropriate, grow taller for multiline content, have sensible minimum and maximum dimensions, remain readable while typing, avoid infinite growth, update React Flow dimensions correctly, and persist text in node.data.

Detect variables using double curly braces:

{{input}}
{{name}}
{{user_name}}
{{value2}}
{{$value}}

Only accept JavaScript-identifier-style names:

- First character: letter, underscore, or dollar sign
- Remaining characters: letters, numbers, underscores, or dollar signs
- Ignore whitespace-containing names
- Ignore hyphenated names
- Ignore names beginning with numbers
- Ignore malformed expressions

For each valid variable, render one target handle on the left side.

The implementation must preserve first-appearance order, remove duplicate variables, use stable unique handle IDs, update handles immediately, remove stale handles, distribute handles vertically, and preserve the output handle on the right.

Use `useUpdateNodeInternals` if required. Create a reusable variable-extraction utility and test it independently.

==================================================
4. STATE MANAGEMENT
==================================================

Review and improve the Zustand store.

Ensure nodes and edges are updated immutably, only the affected node changes during field edits, node IDs are unique, editable values are stored in node.data, React Flow changes continue working, connections continue working, node deletion continues working, and the latest node data is available during submission.

Important values must not be kept only in local component state. Use narrow Zustand selectors to reduce unnecessary re-renders.

==================================================
5. BACKEND INTEGRATION
==================================================

Update backend/main.py.

Implement:

POST /pipelines/parse

Accept a JSON request containing nodes and edges.

Return exactly:

{
  "num_nodes": 0,
  "num_edges": 0,
  "is_dag": true
}

Calculate the number of nodes, number of edges, and whether the directed graph contains no cycle.

Use Kahn’s algorithm or DFS cycle detection.

Expected behavior:

- Empty graph is a DAG
- Single-node graph is a DAG
- Linear graph is a DAG
- Branching graph is a DAG
- Merging graph is a DAG
- Cyclic graph is not a DAG
- Self-loop is not a DAG

Add CORS middleware for local frontend-backend development and validate malformed requests appropriately.

==================================================
6. SUBMIT FLOW
==================================================

Update frontend/src/submit.js.

When Submit is clicked:

- Read the latest nodes and edges from Zustand
- Send them to the backend using POST and JSON
- Show a loading state
- Prevent duplicate submissions while loading
- Handle successful responses
- Handle network errors
- Handle non-2xx responses
- Display node count, edge count, and DAG status clearly

Use an in-app result dialog, toast, or styled result panel if practical.

Example result:

Pipeline analyzed successfully.

Nodes: 5
Connections: 4
Directed acyclic graph: Yes

==================================================
7. PERFORMANCE
==================================================

Add sensible improvements without overengineering:

- Use React.memo where appropriate
- Keep React Flow nodeTypes stable
- Use useMemo for derived Text-node variables
- Use useCallback for event handlers
- Use narrow Zustand selectors
- Avoid unnecessary global updates
- Avoid mutating node objects
- Update only affected nodes
- Avoid expensive work on every render

Do not add Redux, server-side rendering, virtualization, or unnecessary dependencies.

==================================================
8. TESTING
==================================================

Add focused automated tests.

Frontend tests should cover valid variable extraction, invalid variable handling, duplicate removal, variable ordering, dynamic Text-node handles, Text-node updates, Zustand field updates, shared node rendering, submit success, and submit errors.

Backend tests should cover empty graphs, single-node graphs, linear DAGs, branching DAGs, merging DAGs, cyclic graphs, self-loops, correct node counts, correct edge counts, and invalid requests where applicable.

Use the existing React testing setup and add pytest/FastAPI test utilities if needed. Keep tests deterministic and avoid unnecessary mocking.

==================================================
9. DOCUMENTATION
==================================================

Update or create README documentation covering:

- Project overview
- Frontend installation and startup
- Backend installation and startup
- How to use the workflow builder
- How to add a node
- Shared node abstraction
- Dynamic Text variables
- Backend endpoint and response format
- Frontend test commands
- Backend test commands
- Production build command

Include a short README section explaining that the visual direction was inspired by VectorShift’s public product aesthetic, while the implementation and assets are original.

==================================================
10. VERIFICATION
==================================================

Run:

cd frontend
npm install
npm run build
npm test -- --watchAll=false

Also run backend syntax checks and tests.

Manually verify:

1. Original nodes can be dragged onto the canvas.
2. All five new nodes can be dragged onto the canvas.
3. Nodes can be connected.
4. Node fields update correctly.
5. Text node resizing works.
6. Valid variables create handles.
7. Repeated variables create one handle.
8. Invalid variables are ignored.
9. Removed variables remove handles.
10. Linear pipelines return `is_dag: true`.
11. Cyclic pipelines return `is_dag: false`.
12. Submission errors are displayed clearly.
13. The frontend builds successfully.
14. All tests pass.

Do not stop after describing the changes. Implement them directly in the repository.

At the end, summarize files changed, features implemented, tests added, verification commands run, and remaining limitations if any.
```
