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

  return (
    <button
      type="button"
      draggable
      onDragStart={onDragStart}
      onClick={(event) => {
        onAdd(type);

        if (event.detail > 0) event.currentTarget.blur();
      }}
      title={open ? config.description : label}
      className={clsx(
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
