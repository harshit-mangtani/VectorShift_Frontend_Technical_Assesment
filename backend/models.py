from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict


class Node(BaseModel):
    # React Flow sends extra render state; ignore it rather than reject the request.
    model_config = ConfigDict(extra="ignore")

    id: str
    type: Optional[str] = None
    data: Dict[str, Any] = {}


class Edge(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: Optional[str] = None
    source: str
    target: str
    sourceHandle: Optional[str] = None
    targetHandle: Optional[str] = None


class Pipeline(BaseModel):
    nodes: List[Node] = []
    edges: List[Edge] = []


class ParseResponse(BaseModel):
    num_nodes: int
    num_edges: int
    is_dag: bool
