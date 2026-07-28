from dag import is_dag


def test_empty_graph_is_a_dag():
    assert is_dag([], []) is True


def test_single_node_is_a_dag():
    assert is_dag(["a"], []) is True


def test_linear_chain():
    assert is_dag(["a", "b", "c"], [("a", "b"), ("b", "c")]) is True


def test_branching():
    assert is_dag(["a", "b", "c"], [("a", "b"), ("a", "c")]) is True


def test_merging():
    assert is_dag(["a", "b", "c"], [("a", "c"), ("b", "c")]) is True


def test_diamond_reconverges_but_is_still_a_dag():
    edges = [("a", "b"), ("a", "c"), ("b", "d"), ("c", "d")]
    assert is_dag(["a", "b", "c", "d"], edges) is True


def test_self_loop_is_a_cycle():
    assert is_dag(["a"], [("a", "a")]) is False


def test_two_node_cycle():
    assert is_dag(["a", "b"], [("a", "b"), ("b", "a")]) is False


def test_long_cycle():
    nodes = ["a", "b", "c", "d"]
    edges = [("a", "b"), ("b", "c"), ("c", "d"), ("d", "a")]
    assert is_dag(nodes, edges) is False


def test_cycle_in_one_of_two_disconnected_components():
    nodes = ["a", "b", "x", "y"]
    edges = [("a", "b"), ("x", "y"), ("y", "x")]
    assert is_dag(nodes, edges) is False


def test_duplicate_edges_do_not_create_a_false_cycle():
    assert is_dag(["a", "b"], [("a", "b"), ("a", "b")]) is True


def test_edges_referencing_unknown_nodes_are_ignored():
    assert is_dag(["a"], [("a", "ghost"), ("ghost", "a")]) is True


def test_large_graph_completes():
    nodes = [str(i) for i in range(10_000)]
    edges = [(str(i), str(i + 1)) for i in range(9_999)]
    assert is_dag(nodes, edges) is True
