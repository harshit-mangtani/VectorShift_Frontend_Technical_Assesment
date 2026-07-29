import { useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import { ChevronsRight, Pin, PinOff, Search } from 'lucide-react';
import { DraggableNode } from './draggableNode';
import { toolbarGroups } from './nodes/registry';

export const PipelineToolbar = ({ onAdd }) => {
  const [pinned, setPinned] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [query, setQuery] = useState('');
  const [lockedHeight, setLockedHeight] = useState(null);
  const listRef = useRef(null);

  const open = pinned || hovered || focused;

  useEffect(() => {
    if (!open) {
      setQuery('');
      setLockedHeight(null);
    }
  }, [open]);

  const releaseFocus = (event) => {
    setFocused(false);
    if (event.detail > 0) event.currentTarget.blur();
  };

  const togglePin = (event) => {
    setPinned((p) => !p);
    if (pinned) releaseFocus(event);
  };

  const toggleChevron = (event) => {
    if (!pinned) {
      setPinned(true);
      return;
    }
    setPinned(false);
    setHovered(false);
    releaseFocus(event);
  };

  const search = (value) => {
    if (!query && listRef.current) setLockedHeight(listRef.current.offsetHeight);
    if (!value) setLockedHeight(null);
    setQuery(value);
  };

  const groups = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return toolbarGroups;
    return toolbarGroups
      .map((group) => ({
        ...group,
        configs: group.configs.filter((c) => c.label.toLowerCase().includes(term)),
      }))
      .filter((group) => group.configs.length > 0);
  }, [query]);

  const reveal = (children, extra) => (
    <div
      className={clsx(
        'grid rail-ease',
        open ? 'grid-rows-[1fr] opacity-100 delay-75' : 'grid-rows-[0fr] opacity-0',
        extra
      )}
    >
      <div className="min-h-0 overflow-hidden">{children}</div>
    </div>
  );

  return (
    <aside
      aria-label="Node library"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setFocused(false)}
      className={clsx(
        'absolute left-2 top-1/2 z-10 flex -translate-y-1/2 flex-col overflow-hidden sm:left-4',
        'max-h-[calc(100%-2rem)]',
        'glass rounded-lg',
        'rail-ease will-change-[width]',
        open ? 'w-[min(228px,calc(100vw-1rem))]' : 'w-[60px]'
      )}
    >
      <div
        className={clsx(
          'grid shrink-0 rail-ease',
          open ? 'grid-rows-[1fr]' : 'grid-rows-[1fr] sm:grid-rows-[0fr]'
        )}
      >
        <div className="flex min-h-0 items-center justify-between gap-1 overflow-hidden px-2.5 pt-2">
          <span
            className={clsx(
              'field-label overflow-hidden whitespace-nowrap pl-1 rail-ease',
              open ? 'opacity-100 delay-75' : 'opacity-0'
            )}
          >
            Nodes
          </span>

            <button
            type="button"
            onClick={togglePin}
            aria-label={pinned ? 'Unpin node library' : 'Keep node library open'}
            aria-pressed={pinned}
            title={pinned ? 'Unpin' : 'Keep open'}
            className={clsx(
              'hidden rounded-lg p-1.5 transition-all duration-200 active:scale-90',
              'focus:outline-none focus-visible:ring-4 focus-visible:ring-brand/20',
              open && 'sm:inline-flex',
              pinned
                ? 'bg-brand/12 text-brand shadow-inner'
                : 'text-muted hover:bg-white/80 hover:text-ink'
            )}
          >
            {pinned ? <PinOff size={14} /> : <Pin size={14} />}
          </button>

            <button
            type="button"
            onClick={toggleChevron}
            aria-label={open ? 'Collapse node library' : 'Expand node library'}
            aria-expanded={open}
            className="rounded-lg p-1.5 text-muted transition-all duration-200 active:scale-90
                       hover:bg-white/80 hover:text-ink
                       focus:outline-none focus-visible:ring-4 focus-visible:ring-brand/20 sm:hidden"
          >
            <ChevronsRight
              size={15}
              className={clsx('transition-transform duration-300', open && 'rotate-180')}
            />
          </button>
        </div>
      </div>

      {reveal(
        <div className="px-2.5 pt-2">
          <label className="relative block">
            <span className="sr-only">Search nodes</span>
            <Search
              size={14}
              className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              className="field-input pl-8"
              placeholder="Search nodes"
              value={query}
              onChange={(e) => search(e.target.value)}
            />
          </label>
        </div>,
        'shrink-0'
      )}

      <div
        ref={listRef}
        data-testid="node-list"
        style={lockedHeight ? { minHeight: lockedHeight } : undefined}
        className="thin-scroll flex-1 gutter-stable overflow-y-auto overflow-x-hidden p-2.5"
      >
        {groups.map((group) => (
          <section key={group.category} className="mb-1 last:mb-0">
            {reveal(<h2 className="field-label px-1 pb-1 pt-1.5">{group.label}</h2>)}
            <div className="space-y-1">
              {group.configs.map((config) => (
                <DraggableNode
                  key={config.type}
                  config={config}
                  onAdd={onAdd}
                  open={open}
                />
              ))}
            </div>
          </section>
        ))}
        {groups.length === 0 &&
          reveal(<p className="px-1 py-2 text-sm text-muted">No matches.</p>)}
      </div>
    </aside>
  );
};
