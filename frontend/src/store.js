import { create } from 'zustand';
import {
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  MarkerType,
} from 'reactflow';

const EDGE_STYLE = {
  // Custom type: stops short of the target port so the arrowhead is not hidden
  // beneath the node. See edges/TrimmedEdge.js.
  type: 'trimmed',
  markerEnd: { type: MarkerType.ArrowClosed, height: 20, width: 20, color: '#8792ad' },
};

export const useStore = create((set, get) => ({
  nodes: [],
  edges: [],
  nodeIDs: {},

  /** Monotonic per type; never reuses a freed number, so IDs stay unique across deletions. */
  getNodeID: (type) => {
    const nodeIDs = { ...get().nodeIDs, [type]: (get().nodeIDs[type] ?? 0) + 1 };
    set({ nodeIDs });
    return `${type}-${nodeIDs[type]}`;
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

  /** Used to put a node back when a drag-to-delete is cancelled. */
  setNodePosition: (nodeId, position) =>
    set({
      nodes: get().nodes.map((node) =>
        node.id === nodeId ? { ...node, position } : node
      ),
    }),

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
