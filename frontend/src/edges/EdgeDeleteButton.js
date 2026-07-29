import { EdgeLabelRenderer } from 'reactflow';
import { X } from 'lucide-react';
import { useStore } from '../store';

/**
 * Removes a connection from its own midpoint, so you never have to select it first.
 *
 * EdgeLabelRenderer portals this into an overlay that tracks the viewport — the only way
 * to put real DOM on an edge, since the edge itself is an SVG path. That overlay is
 * `pointer-events: none`, hence re-enabling them here.
 */
export const EdgeDeleteButton = ({ id, labelX, labelY }) => {
  const removeEdge = useStore((s) => s.removeEdge);

  return (
    <EdgeLabelRenderer>
      <button
        type="button"
        title="Delete this connection"
        aria-label="Delete this connection"
        onClick={() => removeEdge(id)}
        style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)` }}
        className="nodrag nopan group pointer-events-auto absolute flex h-[15px] w-[15px]
                   items-center justify-center rounded-full border border-brand/40
                   bg-white text-brand shadow-sm transition-colors duration-150
                   hover:border-red-400 hover:bg-red-500 hover:text-white
                   focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
      >
        {/* The button's own transform is its position on the path — transitioning it
            would make the ✕ ease along behind the line every time a node moves. The
            hover grow therefore lives on a child. */}
        <X
          size={9}
          strokeWidth={3}
          className="transition-transform duration-150 group-hover:scale-125"
        />
      </button>
    </EdgeLabelRenderer>
  );
};
