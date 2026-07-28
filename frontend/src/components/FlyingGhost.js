import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { categoryHex } from '../nodes/core/nodeVariants';

const DURATION = 450;

/**
 * Sends a card-shaped stand-in arcing into the delete button after a node is removed.
 * A stand-in rather than the node itself: React Flow owns the node wrapper's transform,
 * so animating it directly would fight the library.
 */
export const FlyingGhost = ({ from, to, category, onDone }) => {
  const [flying, setFlying] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setFlying(true));
    const timer = setTimeout(onDone, DURATION);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
    };
  }, [onDone]);

  // Translate moves the centre; the subsequent scale shrinks around that same centre,
  // so the card converges on the bin rather than drifting past it.
  const dx = to.x - (from.left + from.width / 2);
  const dy = to.y - (from.top + from.height / 2);
  const accent = categoryHex[category] ?? '#94A3B8';

  return createPortal(
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        left: from.left,
        top: from.top,
        width: from.width,
        height: from.height,
        borderColor: accent,
        transform: flying
          ? `translate(${dx}px, ${dy}px) scale(0.06) rotate(14deg)`
          : 'none',
        opacity: flying ? 0 : 1,
        transition: `transform ${DURATION}ms cubic-bezier(.5,-0.05,.75,.5), opacity ${DURATION}ms ease-in`,
      }}
      className="pointer-events-none z-[60] rounded-xl border-2 bg-white shadow-lift"
    />,
    document.body
  );
};
