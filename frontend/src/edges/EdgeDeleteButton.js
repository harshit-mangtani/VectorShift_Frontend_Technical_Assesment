import { EdgeLabelRenderer } from 'reactflow';
import { X } from 'lucide-react';
import { useStore } from '../store';

export const EdgeDeleteButton = ({ id, labelX, labelY }) => {
  const removeEdge = useStore((s) => s.removeEdge);

  return (
    <EdgeLabelRenderer>
      <button
        type="button"
        title="Delete this connection"
        aria-label="Delete this connection"
        onClick={() => removeEdge(id)}
        // No transition on transform: this is the button's position on the path.
        style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)` }}
        className="nodrag nopan group pointer-events-auto absolute flex h-[15px] w-[15px]
                   items-center justify-center rounded-full border border-brand/40
                   bg-white text-brand shadow-sm transition-colors duration-150
                   hover:border-red-400 hover:bg-red-500 hover:text-white
                   focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
      >
        <X
          size={9}
          strokeWidth={3}
          className="transition-transform duration-150 group-hover:scale-125"
        />
      </button>
    </EdgeLabelRenderer>
  );
};
