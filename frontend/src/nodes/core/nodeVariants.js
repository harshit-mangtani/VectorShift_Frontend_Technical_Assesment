import { cva } from 'class-variance-authority';

export const nodeCard = cva('relative rounded-lg border bg-white shadow-card', {
  variants: {
    selected: {
      true: 'border-brand/60 shadow-lift ring-4 ring-brand/10',
      false: 'border-line hover:border-brand/35 hover:shadow-lift',
    },
  },
  defaultVariants: { selected: false },
});

export const nodeChip = 'bg-brand/[0.11] text-brand';

export const ACCENT = '#6366F1';
