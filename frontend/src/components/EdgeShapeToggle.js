import clsx from 'clsx';
import { Spline, Waypoints } from 'lucide-react';

// Icon and label both report the shape currently in use, so the tooltip changes with it
// rather than reading the same either way.
const SHAPE = {
  straight: { Icon: Waypoints, label: 'Straight Connections' },
  curved: { Icon: Spline, label: 'Curved Connections' },
};

export const EdgeShapeToggle = ({ shape, onToggle }) => {
  const { Icon, label } = SHAPE[shape];

  return (
    <button
      type="button"
      onClick={onToggle}
      title={label}
      aria-label={label}
      className={clsx(
        'flex h-12 w-12 items-center justify-center rounded-full border border-white/60',
        'bg-white/45 text-brand shadow-glass backdrop-blur-xl backdrop-saturate-150',
        'transition-all duration-200 ease-out hover:scale-105 hover:bg-white/65',
        'focus:outline-none focus-visible:ring-4 focus-visible:ring-brand/25'
      )}
    >
      <Icon size={20} strokeWidth={2} />
    </button>
  );
};
