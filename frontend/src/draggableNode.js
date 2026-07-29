import clsx from 'clsx';
import { nodeChip } from './nodes/core/nodeVariants';

export const DraggableNode = ({ config, onAdd, open }) => {
  const { type, label, icon: Icon } = config;

  const onDragStart = (event) => {
    event.dataTransfer.setData(
      'application/reactflow',
      JSON.stringify({ nodeType: type })
    );
    event.dataTransfer.effectAllowed = 'move';
  };

  // Click-to-add matters beyond convenience: HTML drag-and-drop does not fire on touch,
  // so tapping is the only way to add a node on a phone or tablet.
  return (
    <button
      type="button"
      draggable
      onDragStart={onDragStart}
      onClick={(event) => {
        onAdd(type);
        // Otherwise the button keeps focus and holds the rail open after the pointer
        // leaves. Keyboard activation (detail 0) must keep its focus.
        if (event.detail > 0) event.currentTarget.blur();
      }}
      title={open ? config.description : label}
      className={clsx(
        // px-1 is load-bearing: collapsed, the icon's offset from the rail edge is the
        // sum of the rail border (1), the list padding (10), this border (1) and this
        // padding (4) — which is exactly half the 60px rail less the 28px icon.
        'group flex w-full cursor-grab items-center gap-2.5 rounded-md px-1',
        'border border-transparent py-1.5 text-left text-sm text-ink',
        'transition-colors duration-200',
        'hover:border-white/80 hover:bg-white/70 hover:shadow-card',
        'active:scale-[.97] active:cursor-grabbing',
        'focus:outline-none focus-visible:ring-4 focus-visible:ring-brand/20'
      )}
    >
      <span
        className={clsx(
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-[10px]',
          'transition-transform duration-200 group-hover:scale-110',
          nodeChip
        )}
      >
        <Icon size={15} strokeWidth={2.1} />
      </span>
      {/* Kept mounted while collapsed so the button retains its accessible name. */}
      {/* Fixed width, clipped by the rail. Animating the label's own width made every
          row re-lay-out on each frame of the expansion — the source of the judder. */}
      <span
        className={clsx(
          'w-[150px] shrink-0 overflow-hidden whitespace-nowrap font-medium rail-ease',
          open ? 'opacity-100 delay-75' : 'opacity-0'
        )}
      >
        {label}
      </span>
    </button>
  );
};
