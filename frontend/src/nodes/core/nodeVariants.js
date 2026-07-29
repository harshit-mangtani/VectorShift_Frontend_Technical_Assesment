import { cva } from 'class-variance-authority';

// Single source of truth for node appearance — editing this restyles every node type.
// Opaque on purpose: overlapping nodes must never show through one another.
export const nodeCard = cva('relative rounded-lg border bg-white shadow-card', {
  variants: {
    selected: {
      true: 'border-brand/60 shadow-lift ring-4 ring-brand/10',
      false: 'border-line hover:border-brand/35 hover:shadow-lift',
    },
  },
  defaultVariants: { selected: false },
});

// One accent, everywhere. Category still drives toolbar grouping and ordering; it stopped
// driving colour because five hues competing across a dense canvas read as noise, not
// information — the icon already says what the node is.
export const nodeChip = 'bg-brand/[0.11] text-brand';

/** The same accent as a raw value, for canvases that can't take a class (minimap, SVG). */
export const ACCENT = '#6366F1';
