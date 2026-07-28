import { useCallback, useRef, useState } from 'react';
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  Panel,
  useReactFlow,
} from 'reactflow';
import clsx from 'clsx';
import { useShallow } from 'zustand/react/shallow';
import { useStore } from './store';
import { useAddNode } from './hooks/useAddNode';
import { nodeTypes, configByType } from './nodes/registry';
import { edgeTypes } from './edges/TrimmedEdge';
import { categoryHex } from './nodes/core/nodeVariants';
import { DeleteDropZone } from './components/DeleteDropZone';
import { ConfirmDialog } from './components/ConfirmDialog';
import { FlyingGhost } from './components/FlyingGhost';

import 'reactflow/dist/style.css';

const GRID = 20;
const HIT_PADDING = 14;
const proOptions = { hideAttribution: true };
const minimapColor = (node) =>
  categoryHex[configByType[node.type]?.category] ?? '#94A3B8';

const prefersReducedMotion = () =>
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// React Flow hands back a mouse event for pointer drags and a touch event on mobile.
const pointerOf = (event) => {
  if (typeof event?.clientX === 'number') return event;
  const touch = event?.changedTouches?.[0] ?? event?.touches?.[0];
  return touch ?? event?.sourceEvent ?? null;
};

const selector = (state) => ({
  nodes: state.nodes,
  edges: state.edges,
  onNodesChange: state.onNodesChange,
  onEdgesChange: state.onEdgesChange,
  onConnect: state.onConnect,
});

export const PipelineUI = () => {
  const { screenToFlowPosition } = useReactFlow();
  const addNode = useAddNode();
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect } = useStore(
    useShallow(selector)
  );
  const removeNode = useStore((s) => s.removeNode);
  const removeEdge = useStore((s) => s.removeEdge);
  const setNodePosition = useStore((s) => s.setNodePosition);

  const trashRef = useRef(null);
  const origin = useRef(null);
  const [armed, setArmed] = useState(false);
  const [pending, setPending] = useState(null);
  const [ghost, setGhost] = useState(null);
  const [swallowing, setSwallowing] = useState(false);

  const selected = nodes.find((node) => node.selected);
  const selectedEdge = edges.find((edge) => edge.selected);

  // Nodes are confirmed before deletion; a connection is trivial to redraw, so it goes
  // straight away.
  const deleteSelection = useCallback(() => {
    if (selected) setPending(selected);
    else if (selectedEdge) removeEdge(selectedEdge.id);
  }, [selected, selectedEdge, removeEdge]);

  const deleteTitle = selected
    ? 'Delete the selected node'
    : selectedEdge
    ? 'Delete the selected connection'
    : 'Select a node or connection, or drag a node here';

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      const payload = event.dataTransfer.getData('application/reactflow');
      if (!payload) return;

      const { nodeType } = JSON.parse(payload);
      if (!configByType[nodeType]) return;

      addNode(
        nodeType,
        screenToFlowPosition({ x: event.clientX, y: event.clientY })
      );
    },
    [addNode, screenToFlowPosition]
  );

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const overTrash = useCallback((event) => {
    const zone = trashRef.current;
    const point = pointerOf(event);
    if (!zone || !point) return false;

    const r = zone.getBoundingClientRect();
    return (
      point.clientX >= r.left - HIT_PADDING &&
      point.clientX <= r.right + HIT_PADDING &&
      point.clientY >= r.top - HIT_PADDING &&
      point.clientY <= r.bottom + HIT_PADDING
    );
  }, []);

  const onNodeDragStart = useCallback((_, node) => {
    origin.current = { id: node.id, position: node.position };
  }, []);

  // Only flips on a boundary crossing, so this does not re-render per frame.
  const onNodeDrag = useCallback(
    (event) => {
      const over = overTrash(event);
      setArmed((was) => (was === over ? was : over));
    },
    [overTrash]
  );

  const onNodeDragStop = useCallback(
    (event, node) => {
      if (overTrash(event)) setPending(node);
      setArmed(false);
    },
    [overTrash]
  );

  const confirmDelete = useCallback(() => {
    const el = document.querySelector(`.react-flow__node[data-id="${pending.id}"]`);
    const zone = trashRef.current;

    if (el && zone && !prefersReducedMotion()) {
      const from = el.getBoundingClientRect();
      const box = zone.getBoundingClientRect();
      setGhost({
        from,
        to: { x: box.left + box.width / 2, y: box.top + box.height / 2 },
        category: configByType[pending.type]?.category,
      });
      setSwallowing(true);
    }

    removeNode(pending.id);
    setPending(null);
  }, [pending, removeNode]);

  const endSwoop = useCallback(() => {
    setGhost(null);
    setSwallowing(false);
  }, []);

  // Cancelling should not leave the node parked on top of the delete button.
  const cancelDelete = useCallback(() => {
    if (origin.current?.id === pending?.id) {
      setNodePosition(pending.id, origin.current.position);
    }
    setPending(null);
  }, [pending, setNodePosition]);

  return (
    <div className={clsx('relative h-full w-full', armed && 'trash-armed')}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onNodeDragStart={onNodeDragStart}
        onNodeDrag={onNodeDrag}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        proOptions={proOptions}
        snapGrid={[GRID, GRID]}
        connectionLineType="smoothstep"
        connectionLineStyle={{ stroke: '#6366F1', strokeWidth: 2 }}
        defaultEdgeOptions={{ type: 'trimmed' }}
        deleteKeyCode={['Backspace', 'Delete']}
        elevateNodesOnSelect
        minZoom={0.2}
        maxZoom={2}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={GRID}
          size={1.4}
          color="#C2C8DC"
        />
        {/* Zoom controls sit beside the minimap; on mobile the minimap is hidden and
            the controls take the corner themselves. */}
        <Controls
          position="bottom-right"
          showInteractive={false}
          className="!bottom-4 !right-4 !m-0 sm:!right-[13.25rem]"
        />
        <MiniMap
          pannable
          zoomable
          nodeColor={minimapColor}
          nodeStrokeWidth={0}
          style={{ width: 180, height: 120 }}
          maskColor="rgba(244,245,251,0.65)"
          className="!bottom-4 !right-4 !m-0 !hidden !rounded-xl !border !border-white/70
                     !bg-white/55 !shadow-glass !backdrop-blur-xl sm:!block"
        />

        {/* Sits directly above the zoom bar; only present while a node is in hand. */}
        <Panel
          position="bottom-right"
          className="!bottom-[3.75rem] !right-4 !m-0 sm:!right-[13.25rem]"
        >
          <DeleteDropZone
            ref={trashRef}
            armed={armed || swallowing}
            swallowing={swallowing}
            disabled={!selected && !selectedEdge}
            title={deleteTitle}
            onClick={deleteSelection}
          />
        </Panel>
      </ReactFlow>

      {nodes.length === 0 && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center
                        pl-[76px] pr-4 pt-14 sm:px-4 sm:pt-14">
          <div className="animate-floatIn rounded-2xl border border-dashed border-line
                          bg-white/55 px-6 py-5 text-center shadow-glass backdrop-blur-md
                          sm:px-8 sm:py-6">
            <p className="text-sm font-medium tracking-tight text-ink">
              Start building your pipeline
            </p>
            <p className="mt-1 text-xs text-muted">
              Add a node from the library to begin.
            </p>
          </div>
        </div>
      )}

      {ghost && <FlyingGhost {...ghost} onDone={endSwoop} />}

      {pending && (
        <ConfirmDialog
          title="Delete this node?"
          message={`“${configByType[pending.type]?.label ?? pending.type}” and any
                    connections to it will be removed. This can't be undone.`}
          confirmLabel="Delete node"
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
        />
      )}
    </div>
  );
};
