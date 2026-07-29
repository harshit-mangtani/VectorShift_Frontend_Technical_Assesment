import { create } from 'zustand';
import {
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  MarkerType,
} from 'reactflow';

// No `type` here: the shape is a view preference, applied when the edge is rendered so
// that flipping it re-routes the connections already on the canvas.
const EDGE_STYLE = {
  // Matches the resting stroke in index.css — the arrowhead is part of the same line.
  markerEnd: { type: MarkerType.ArrowClosed, height: 20, width: 20, color: '#6366f1' },
};

export const useStore = create((set, get) => ({
  nodes: [],
  edges: [],
  edgeShape: 'straight',
  // Deleting a node is confirmed wherever it is triggered from — the bin, a drag onto the
  // bin, or the card's own ✕ — so the request lives here rather than in one component.
  pendingDeleteId: null,

  toggleEdgeShape: () =>
    set({ edgeShape: get().edgeShape === 'straight' ? 'curved' : 'straight' }),

  requestDelete: (nodeId) => set({ pendingDeleteId: nodeId }),

  /**
   * Lowest number not currently on the canvas, per type. Derived from `nodes` rather than
   * from a counter: an id is user-facing here — it labels the card and the delete dialog —
   * so deleting `llm-1` and adding another should give you `llm-1`, not `llm-2` and a gap
   * that never closes.
   *
   * Reuse is safe because `removeNode` takes the node's edges with it, so nothing can
   * still be pointing at the freed id. Callers must add the node before asking again.
   */
  getNodeID: (type) => {
    const taken = new Set(
      get()
        .nodes.filter((node) => node.type === type)
        .map((node) => node.id)
    );

    let n = 1;
    while (taken.has(`${type}-${n}`)) n += 1;
    return `${type}-${n}`;
  },

  addNode: (node) => set({ nodes: [...get().nodes, node] }),

  onNodesChange: (changes) =>
    set({ nodes: applyNodeChanges(changes, get().nodes) }),

  onEdgesChange: (changes) =>
    set({ edges: applyEdgeChanges(changes, get().edges) }),

  onConnect: (connection) =>
    set({ edges: addEdge({ ...connection, ...EDGE_STYLE }, get().edges) }),

  /** Removes a node and every edge attached to it. */
  removeNode: (nodeId) =>
    set({
      nodes: get().nodes.filter((node) => node.id !== nodeId),
      edges: get().edges.filter(
        (edge) => edge.source !== nodeId && edge.target !== nodeId
      ),
    }),

  /** Connections are cheap to redraw, so deleting one is not confirmed. */
  removeEdge: (edgeId) =>
    set({ edges: get().edges.filter((edge) => edge.id !== edgeId) }),

  clearAll: () => set({ nodes: [], edges: [] }),

  /** Replaces only the target node; every other node keeps its reference so memo holds. */
  updateNodeField: (nodeId, fieldName, fieldValue) =>
    set({
      nodes: get().nodes.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, [fieldName]: fieldValue } }
          : node
      ),
    }),

  /**
   * React Flow keeps edges alive when a handle disappears, leaving dangling connections
   * that inflate the submitted graph. Called whenever a node's handle set changes.
   *
   * Handle ids are stable and independent of any display label, so this only ever fires
   * for a genuine removal — renaming a Text/Transform variable does not reach here.
   */
  pruneEdges: (nodeId, validHandleIds) => {
    const valid = new Set(validHandleIds);
    const edges = get().edges.filter((edge) => {
      if (edge.target === nodeId && edge.targetHandle)
        return valid.has(edge.targetHandle);
      if (edge.source === nodeId && edge.sourceHandle)
        return valid.has(edge.sourceHandle);
      return true;
    });
    if (edges.length !== get().edges.length) set({ edges });
  },
}));
