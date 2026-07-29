import { create } from 'zustand';
import {
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  MarkerType,
} from 'reactflow';

const EDGE_STYLE = {
  markerEnd: { type: MarkerType.ArrowClosed, height: 20, width: 20, color: '#6366f1' },
};

export const useStore = create((set, get) => ({
  nodes: [],
  edges: [],
  edgeShape: 'straight',

  pendingDeleteId: null,

  toggleEdgeShape: () =>
    set({ edgeShape: get().edgeShape === 'straight' ? 'curved' : 'straight' }),

  requestDelete: (nodeId) => set({ pendingDeleteId: nodeId }),

  // Lowest free number per type, so deleting llm-1 frees it. Add before asking again.
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

  removeNode: (nodeId) =>
    set({
      nodes: get().nodes.filter((node) => node.id !== nodeId),
      edges: get().edges.filter(
        (edge) => edge.source !== nodeId && edge.target !== nodeId
      ),
    }),

  removeEdge: (edgeId) =>
    set({ edges: get().edges.filter((edge) => edge.id !== edgeId) }),

  clearAll: () => set({ nodes: [], edges: [] }),

  // Only the edited node is replaced; the rest keep identity so React.memo holds.
  updateNodeField: (nodeId, fieldName, fieldValue) =>
    set({
      nodes: get().nodes.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, [fieldName]: fieldValue } }
          : node
      ),
    }),

  // React Flow keeps edges alive when a handle disappears; these would inflate num_edges.
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
