import { useCallback, useEffect, useMemo, useRef } from 'react';
import ReactFlow, {
  Background,
  BackgroundVariant,
  ControlButton,
  Controls,
  MiniMap,
  Panel,
  useReactFlow,
  useStore as useFlowStore,
  useStoreApi,
} from 'reactflow';
import { Lock, Maximize, Unlock } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useStore } from './store';
import { useAddNode } from './hooks/useAddNode';
import { nodeTypes, configByType } from './nodes/registry';
import { edgeTypes } from './edges';
import { fitViewport } from './lib/fitViewport';
import { CONNECTION_LINE, shapeEdges } from './lib/edgeShape';
import { ACCENT } from './nodes/core/nodeVariants';
import { EdgeShapeToggle } from './components/EdgeShapeToggle';
import { ConfirmDialog } from './components/ConfirmDialog';

const GRID = 20;
const MIN_ZOOM = 0.2;
const MAX_ZOOM = 2;
// Four 26px buttons, three 2px gaps, 3px of padding each side (see index.css) — the
// minimap matches it so the corner reads as one cluster, not two stacked objects.
const CONTROLS_HEIGHT = 4 * 26 + 3 * 2 + 6;
const DELETE_KEY = 'Delete';
const proOptions = { hideAttribution: true };
const minimapColor = () => ACCENT;

// Backspace inside a field means "erase a character", never "delete the node".
const isTyping = (el) =>
  !!el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));

const selector = (state) => ({
  nodes: state.nodes,
  edges: state.edges,
  onNodesChange: state.onNodesChange,
  onEdgesChange: state.onEdgesChange,
  onConnect: state.onConnect,
});

export const PipelineUI = () => {
  const { screenToFlowPosition, setViewport, fitView } = useReactFlow();
  const flowStore = useStoreApi();
  const interactive = useFlowStore((s) => s.nodesDraggable);
  const addNode = useAddNode();
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect } = useStore(
    useShallow(selector)
  );
  const removeNode = useStore((s) => s.removeNode);
  const removeEdge = useStore((s) => s.removeEdge);
  const edgeShape = useStore((s) => s.edgeShape);
  const toggleEdgeShape = useStore((s) => s.toggleEdgeShape);
  const pendingDeleteId = useStore((s) => s.pendingDeleteId);
  const requestDelete = useStore((s) => s.requestDelete);

  const shapedEdges = useMemo(() => shapeEdges(edges, edgeShape), [edges, edgeShape]);

  const paneRef = useRef(null);
  const selected = nodes.find((node) => node.selected);
  const selectedEdge = edges.find((edge) => edge.selected);
  const pending = nodes.find((node) => node.id === pendingDeleteId);

  // React Flow's own deleteKeyCode removes the selection outright, so it is turned off and
  // handled here instead: a node is confirmed first, a connection is not — it costs one
  // drag to redraw, and a dialog for that is friction rather than safety.
  //
  // Delete only, never Backspace. Backspace is an editing key before it is a destructive
  // one, and binding it canvas-wide means a stray press outside a field costs a node.
  useEffect(() => {
    const onKeyDown = (event) => {
      // event.target, not activeElement: the key was delivered to whatever had focus, and
      // that is the thing entitled to consume it.
      if (event.key !== DELETE_KEY || isTyping(event.target)) return;

      if (selected) requestDelete(selected.id);
      else if (selectedEdge) removeEdge(selectedEdge.id);
      else return;

      event.preventDefault();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selected, selectedEdge, requestDelete, removeEdge]);

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

  // React Flow's own fit uses the whole pane, which tucks nodes under the floating
  // chrome. This frames them into what is actually visible instead.
  const fitToFreeSpace = useCallback(() => {
    const pane = paneRef.current?.getBoundingClientRect();
    const viewport =
      pane && fitViewport(nodes, pane, { minZoom: MIN_ZOOM, maxZoom: MAX_ZOOM });

    if (viewport) setViewport(viewport, { duration: 300 });
    else fitView({ duration: 300 });
  }, [nodes, setViewport, fitView]);

  // Locking the canvas is three separate React Flow flags; the control presents them as
  // one, which is how a user thinks about it.
  const toggleLock = useCallback(() => {
    const next = !flowStore.getState().nodesDraggable;
    flowStore.setState({
      nodesDraggable: next,
      nodesConnectable: next,
      elementsSelectable: next,
    });
  }, [flowStore]);

  const confirmDelete = useCallback(() => {
    removeNode(pending.id);
    requestDelete(null);
  }, [pending, removeNode, requestDelete]);

  const cancelDelete = useCallback(() => requestDelete(null), [requestDelete]);

  return (
    <div ref={paneRef} className="relative h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={shapedEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        proOptions={proOptions}
        snapGrid={[GRID, GRID]}
        connectionLineType={CONNECTION_LINE[edgeShape]}
        connectionLineStyle={{ stroke: '#9aa1b5', strokeWidth: 2 }}
        deleteKeyCode={null}
        elevateNodesOnSelect
        minZoom={MIN_ZOOM}
        maxZoom={MAX_ZOOM}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={GRID}
          size={1.4}
          color="#C2C8DC"
        />
        {/* overflow-hidden so the map's square svg is clipped to the rounded glass. */}
        <MiniMap
          pannable
          zoomable
          nodeColor={minimapColor}
          nodeStrokeWidth={0}
          style={{ width: 180, height: CONTROLS_HEIGHT }}
          maskColor="rgba(244,245,251,0.65)"
          className="!bottom-4 !right-4 !m-0 !hidden !overflow-hidden !rounded-xl !border
                     !border-white/70 !bg-white/55 !shadow-glass !backdrop-blur-xl sm:!block"
        />

        {/* Canvas instruments, laid out beside the minimap; on mobile the minimap is
            hidden and the row takes the corner itself. */}
        <Panel
          position="bottom-right"
          className="!bottom-4 !right-4 !m-0 flex items-end gap-2 sm:!right-[13.25rem]"
        >
          <EdgeShapeToggle shape={edgeShape} onToggle={toggleEdgeShape} />
          {/* The built-in fit is replaced rather than extended — React Flow runs its own
              first, which would frame the graph under the chrome and then animate off it. */}
          <Controls
            showFitView={false}
            showInteractive={false}
            className="!static !m-0 !flex-col"
          >
            <ControlButton onClick={fitToFreeSpace} title="fit view" aria-label="fit view">
              <Maximize size={13} strokeWidth={2.5} />
            </ControlButton>
            <ControlButton
              onClick={toggleLock}
              title={interactive ? 'Lock canvas' : 'Unlock canvas'}
              aria-label={interactive ? 'Lock canvas' : 'Unlock canvas'}
              aria-pressed={!interactive}
            >
              {interactive ? (
                <Unlock size={13} strokeWidth={2.5} />
              ) : (
                <Lock size={13} strokeWidth={2.5} />
              )}
            </ControlButton>
          </Controls>
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

      {pending && (
        // Named by id, not by type: with three LLM nodes on the canvas, "LLM will be
        // removed" doesn't tell you which one you are about to lose.
        <ConfirmDialog
          title="Delete this node?"
          message={`${configByType[pending.type]?.label ?? pending.type} “${pending.id}”
                    and any connections to it will be removed. This can't be undone.`}
          confirmLabel="Delete node"
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
        />
      )}
    </div>
  );
};
