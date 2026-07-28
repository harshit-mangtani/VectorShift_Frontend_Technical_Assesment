import { forwardRef } from 'react';
import clsx from 'clsx';

/** Hand-drawn so the lid can be its own group and animate open. */
const BinIcon = ({ open }) => (
  <svg
    viewBox="0 0 24 24"
    width="21"
    height="21"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <g
      className={clsx(
        'transition-transform duration-200 ease-out',
        open && '-translate-y-[2px] -rotate-[22deg]'
      )}
      style={{ transformBox: 'fill-box', transformOrigin: 'left center' }}
    >
      <path d="M3 6h18" />
      <path d="M9 6V4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V6" />
    </g>
    <path d="M6 8.5v11A1.5 1.5 0 0 0 7.5 21h9a1.5 1.5 0 0 0 1.5-1.5v-11" />
    <path d="M10 12v5M14 12v5" />
  </svg>
);

/**
 * Delete target. React Flow drags nodes with pointer events rather than HTML5
 * drag-and-drop, so the canvas hit-tests this element's rect instead of listening
 * for drop events. Also clickable, to delete the current selection.
 */
export const DeleteDropZone = forwardRef(
  ({ armed, swallowing, disabled, title, onClick }, ref) => (
  <button
    ref={ref}
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-label="Delete selection"
    title={title}
    className={clsx(
      'flex h-12 w-12 items-center justify-center rounded-full border backdrop-blur-xl',
      'transition-all duration-200 ease-out',
      'focus:outline-none focus-visible:ring-4 focus-visible:ring-red-500/25',
      armed
        ? 'scale-125 border-red-400/60 bg-red-500/90 text-white shadow-[0_0_0_10px_rgba(239,68,68,0.14)]'
        : 'border-white/60 bg-white/45 text-red-500 shadow-glass backdrop-saturate-150 hover:scale-105 hover:bg-red-50/70',
      // The gulp as the node lands.
      swallowing && 'animate-gulp',
      disabled && !armed && 'opacity-60'
    )}
  >
    <BinIcon open={armed} />
  </button>
  )
);
