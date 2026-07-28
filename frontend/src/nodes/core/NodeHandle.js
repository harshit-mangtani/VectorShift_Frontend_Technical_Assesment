import { memo } from 'react';
import { Handle, Position } from 'reactflow';

const POSITION = { left: Position.Left, right: Position.Right };

// Labels sit outside the card so they can never collide with field content, whose
// width varies per node. `calc(100% + 12px)` clears the handle dot, which straddles
// the border at -5px.
const OUTSIDE = 'calc(100% + 12px)';

// Edges leave a port horizontally, straight through where the label sits. Rather than a
// plate — which reads as a grey box — the same white shadow is stacked several times to
// build an opaque halo that hugs the glyphs, so the line just appears to break around
// the text. Background stays fully transparent.
const HALO = [
  '0 0 3px #fff',
  '0 0 3px #fff',
  '0 0 4px #fff',
  '0 0 6px #fff',
  '0 0 9px rgba(255,255,255,.95)',
  '0 0 14px rgba(255,255,255,.75)',
].join(', ');

/**
 * Distributes ports evenly down the node edge, so configs never hand-tune offsets.
 * `index`/`count` are within the same side.
 */
export const NodeHandle = memo(({ nodeId, handle, index, count }) => {
  const side = handle.position ?? (handle.type === 'target' ? 'left' : 'right');
  const top = `${((index + 1) / (count + 1)) * 100}%`;

  return (
    <>
      <Handle
        type={handle.type}
        position={POSITION[side]}
        id={`${nodeId}-${handle.id}`}
        style={{ top }}
      />
      {handle.label && (
        <span
          className="pointer-events-none absolute -translate-y-1/2 whitespace-nowrap
                     bg-transparent text-2xs font-semibold leading-4 text-muted"
          style={{
            top,
            [side === 'left' ? 'right' : 'left']: OUTSIDE,
            textShadow: HALO,
          }}
          title={handle.label}
        >
          {handle.label}
        </span>
      )}
    </>
  );
});
