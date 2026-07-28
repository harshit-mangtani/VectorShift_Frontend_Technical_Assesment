"""Cycle detection for pipeline graphs."""

from collections import defaultdict, deque
from typing import Iterable, Sequence, Tuple


def is_dag(node_ids: Iterable[str], edges: Sequence[Tuple[str, str]]) -> bool:
    """Kahn's algorithm, iterative so deep pipelines cannot exhaust the stack.

    Edges referencing unknown nodes are ignored rather than treated as an error;
    a self-loop is a cycle by definition.
    """
    nodes = set(node_ids)
    outgoing = defaultdict(list)
    indegree = {node: 0 for node in nodes}

    for source, target in edges:
        if source not in nodes or target not in nodes:
            continue
        outgoing[source].append(target)
        indegree[target] += 1

    queue = deque(node for node, degree in indegree.items() if degree == 0)
    visited = 0

    while queue:
        node = queue.popleft()
        visited += 1
        for neighbour in outgoing[node]:
            indegree[neighbour] -= 1
            if indegree[neighbour] == 0:
                queue.append(neighbour)

    # Anything left has an unresolved dependency, which only a cycle can cause.
    return visited == len(nodes)
