import { render } from '@testing-library/react';
import ReactFlow, { ReactFlowProvider } from 'reactflow';
import { nodeTypes, initialNodeData } from './nodes/registry';
import { useStore } from './store';

export const resetStore = () =>
  useStore.setState({ nodes: [], edges: [], nodeIDs: {} });

export const makeNode = (type, id, data) => ({
  id,
  type,
  position: { x: 0, y: 0 },
  data: { ...initialNodeData(type, id), ...data },
});

/** Renders nodes inside a real React Flow canvas — the only reliable way to mount handles. */
export const renderFlow = (nodes, edges = []) => {
  useStore.setState({ nodes, edges });

  const Canvas = () => {
    const { nodes: n, edges: e, onNodesChange, onEdgesChange } = useStore();
    return (
      <div style={{ width: 800, height: 600 }}>
        <ReactFlow
          nodes={n}
          edges={e}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
        />
      </div>
    );
  };

  return render(
    <ReactFlowProvider>
      <Canvas />
    </ReactFlowProvider>
  );
};

export const handleIds = (container) =>
  [...container.querySelectorAll('.react-flow__handle')].map((el) =>
    el.getAttribute('data-handleid')
  );
