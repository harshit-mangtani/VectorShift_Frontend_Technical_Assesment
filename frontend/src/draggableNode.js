import clsx from 'clsx';
import { categoryChip } from './nodes/core/nodeVariants';

export const DraggableNode = ({ config, onAdd, open }) => {
  const { type, label, icon: Icon, category } = config;

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
        'group flex w-full cursor-grab items-center rounded-xl border border-transparent',
        'py-1.5 text-left text-sm text-ink transition-all duration-200',
        'hover:border-white/80 hover:bg-white/70 hover:shadow-card',
        'active:scale-[.97] active:cursor-grabbing',
        'focus:outline-none focus-visible:ring-4 focus-visible:ring-brand/20',
        open ? 'gap-2.5 px-1.5' : 'justify-center gap-0 px-0'
      )}
    >
      <span
        className={clsx(
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-[10px]',
          'transition-transform duration-200 group-hover:scale-110',
          categoryChip[category]
        )}
      >
        <Icon size={15} strokeWidth={2.1} />
      </span>
      {/* Kept mounted while collapsed so the button retains its accessible name. */}
      <span
        className={clsx(
          'overflow-hidden whitespace-nowrap font-medium',
          'transition-[max-width,opacity] duration-300 ease-out',
          open ? 'max-w-[150px] opacity-100' : 'max-w-0 opacity-0'
        )}
      >
        {label}
      </span>
    </button>
  );
};
