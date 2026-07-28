# Backend

FastAPI service that analyses a pipeline graph.

```bash
pip install -r requirements.txt
uvicorn main:app --reload      # http://localhost:8000
pytest -q                      # 21 tests
```

Interactive docs at `http://localhost:8000/docs`.

## Endpoints

### `GET /`

Health check. → `{"Ping": "Pong"}`

### `POST /pipelines/parse`

**Request**

```json
{
  "nodes": [{ "id": "a", "type": "text", "data": {} }],
  "edges": [{ "id": "e1", "source": "a", "target": "b",
              "sourceHandle": "a-output", "targetHandle": "b-input" }]
}
```

Only `id` is required on a node; only `source` and `target` on an edge. Models are
declared `extra="ignore"`, so React Flow's render state (`position`, `width`, `selected`,
`dragging`, …) can be sent as-is without a validation error.

**Response**

```json
{ "num_nodes": 1, "num_edges": 1, "is_dag": true }
```

Malformed payloads — a node without an `id`, an edge without a `source` — return `422`.

## Cycle detection

`dag.py` implements **Kahn's algorithm**, O(V+E):

1. Compute in-degrees.
2. Drain every node with in-degree 0 into a queue, decrementing its neighbours.
3. If the drain count is less than the node count, something has an unresolvable
   dependency — which only a cycle can cause.

Iterative rather than recursive DFS, so a deep pipeline can't exhaust the call stack.
A self-loop is a cycle. Edges referencing unknown node IDs are ignored rather than raising.

## CORS

Restricted to `http://localhost:3000` and `http://127.0.0.1:3000` for local development,
`GET` and `POST` only — an explicit origin list rather than `*`.

## Tests

`test_dag.py` covers the algorithm directly: empty, single node, linear, branching,
merging, diamond, self-loop, 2-cycle, long cycle, a cycle in one of two disconnected
components, duplicate edges, unknown-node references, and a 10,000-node graph.

`test_api.py` covers the HTTP layer: response shape and exact key set, counts, DAG results,
tolerance of React Flow's extra fields, `422` on malformed input, CORS preflight, health.
