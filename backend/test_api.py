from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


def node(node_id, node_type="text"):
    return {"id": node_id, "type": node_type, "data": {}}


def edge(source, target):
    return {"id": f"{source}-{target}", "source": source, "target": target}


def parse(nodes, edges):
    response = client.post("/pipelines/parse", json={"nodes": nodes, "edges": edges})
    assert response.status_code == 200
    return response.json()


def test_health():
    assert client.get("/").json() == {"Ping": "Pong"}


def test_empty_pipeline():
    assert parse([], []) == {"num_nodes": 0, "num_edges": 0, "is_dag": True}


def test_counts_and_dag_for_a_linear_pipeline():
    nodes = [node("a"), node("b"), node("c")]
    edges = [edge("a", "b"), edge("b", "c")]
    assert parse(nodes, edges) == {"num_nodes": 3, "num_edges": 2, "is_dag": True}


def test_cycle_is_reported():
    nodes = [node("a"), node("b")]
    edges = [edge("a", "b"), edge("b", "a")]
    assert parse(nodes, edges)["is_dag"] is False


def test_response_contains_exactly_the_required_keys():
    assert set(parse([node("a")], [])) == {"num_nodes", "num_edges", "is_dag"}


def test_react_flow_render_state_does_not_break_validation():
    nodes = [
        {
            "id": "a",
            "type": "text",
            "data": {"text": "hi"},
            "position": {"x": 1, "y": 2},
            "selected": True,
            "dragging": False,
            "width": 232,
        }
    ]
    assert parse(nodes, [])["num_nodes"] == 1


def test_malformed_payload_is_rejected():
    response = client.post("/pipelines/parse", json={"nodes": [{"no_id": 1}], "edges": []})
    assert response.status_code == 422


def test_cors_preflight_allows_the_dev_frontend():
    response = client.options(
        "/pipelines/parse",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "POST",
        },
    )
    assert response.status_code == 200
    assert (
        response.headers["access-control-allow-origin"] == "http://localhost:3000"
    )
