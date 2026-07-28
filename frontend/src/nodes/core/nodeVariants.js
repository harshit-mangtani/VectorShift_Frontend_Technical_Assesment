import { cva } from 'class-variance-authority';

// Single source of truth for node appearance — editing this restyles every node type.
// Opaque on purpose: overlapping nodes must never show through one another.
export const nodeCard = cva('relative rounded-2xl border bg-white shadow-card', {
  variants: {
    selected: {
      true: 'border-brand/60 shadow-lift ring-4 ring-brand/10',
      false: 'border-line hover:border-brand/35 hover:shadow-lift',
    },
  },
  defaultVariants: { selected: false },
});

export const categoryChip = {
  io: 'bg-cat-io/10 text-cat-io',
  llm: 'bg-cat-llm/10 text-cat-llm',
  logic: 'bg-cat-logic/10 text-cat-logic',
  data: 'bg-cat-data/10 text-cat-data',
  utility: 'bg-cat-utility/10 text-cat-utility',
};

// Faint wash behind the card header, so category reads without a hard rail.
export const categoryTint = {
  io: 'from-cat-io/[0.07]',
  llm: 'from-cat-llm/[0.07]',
  logic: 'from-cat-logic/[0.07]',
  data: 'from-cat-data/[0.07]',
  utility: 'from-cat-utility/[0.07]',
};

export const categoryHex = {
  io: '#3B82F6',
  llm: '#8B5CF6',
  logic: '#F97316',
  data: '#06B6D4',
  utility: '#7C8698',
};
