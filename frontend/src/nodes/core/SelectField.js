import { useCallback, useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { Check, ChevronDown } from 'lucide-react';

const HANDLED = new Set([
  'ArrowDown',
  'ArrowUp',
  'Home',
  'End',
  'Enter',
  ' ',
  'Escape',
]);

export const SelectField = ({ id, options, value, onChange, invalid, ...aria }) => {
  const [open, setOpen] = useState(false);
  const wrap = useRef(null);
  const list = useRef(null);

  const selectedIndex = Math.max(
    0,
    options.findIndex((o) => o.value === value)
  );
  const [active, setActive] = useState(selectedIndex);

  const [keyNav, setKeyNav] = useState(false);
  const current = options[selectedIndex];

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (!wrap.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', onDown, true);
    document.addEventListener('mousedown', onDown, true);
    return () => {
      document.removeEventListener('pointerdown', onDown, true);
      document.removeEventListener('mousedown', onDown, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    list.current?.children[active]?.scrollIntoView?.({ block: 'nearest' });
  }, [open, active]);

  const openList = useCallback(
    (viaKeyboard) => {
      setActive(selectedIndex);
      setKeyNav(Boolean(viaKeyboard));
      setOpen(true);
    },
    [selectedIndex]
  );

  const commit = useCallback(
    (index) => {
      onChange(options[index].value);
      setOpen(false);
    },
    [onChange, options]
  );

  const move = useCallback(
    (delta) => {
      setKeyNav(true);
      setActive((a) => (a + delta + options.length) % options.length);
    },
    [options.length]
  );

  const jumpTo = useCallback((index) => {
    setKeyNav(true);
    setActive(index);
  }, []);

  const onKeyDown = (e) => {
    if (HANDLED.has(e.key)) e.stopPropagation();

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (open) move(1);
        else openList(true);
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (open) move(-1);
        else openList(true);
        break;
      case 'Home':
        if (open) {
          e.preventDefault();
          jumpTo(0);
        }
        break;
      case 'End':
        if (open) {
          e.preventDefault();
          jumpTo(options.length - 1);
        }
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (open) commit(active);
        else openList(true);
        break;
      case 'Escape':

        setOpen(false);
        break;
      case 'Tab':
        setOpen(false);
        break;
      default:
    }
  };

  return (
    <div ref={wrap} className="relative">
      <button
        id={id}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-listbox`}
        aria-activedescendant={open ? `${id}-opt-${active}` : undefined}
        {...aria}
        onClick={() => (open ? setOpen(false) : openList(false))}
        onKeyDown={onKeyDown}
        className={clsx(
          'field-input nodrag flex cursor-pointer items-center justify-between gap-2 text-left',
          invalid && 'field-invalid'
        )}
      >
        <span className="truncate">{current?.label}</span>
        <ChevronDown
          size={13}
          className={clsx(
            'shrink-0 text-muted transition-transform duration-200',
            open && 'rotate-180 text-brand'
          )}
        />
      </button>

      {open && (
        <ul
          ref={list}
          role="listbox"
          id={`${id}-listbox`}
          className="nodrag nowheel absolute left-0 right-0 top-full z-50 mt-1.5 max-h-52
                     animate-popIn overflow-y-auto rounded-xl border border-line bg-white
                     p-1 shadow-lift"
        >
          {options.map((option, i) => {
            const isSelected = i === selectedIndex;
            const isActive = i === active;
            return (
              <li
                key={option.value}
                id={`${id}-opt-${i}`}
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => {
                  setActive(i);
                  setKeyNav(false);
                }}
                onClick={() => commit(i)}
                className={clsx(
                  'flex cursor-pointer items-center justify-between gap-2 rounded-lg px-2.5 py-1.5',
                  'text-sm transition-colors duration-100',
                  isSelected && 'bg-brand-soft font-medium text-brand',

                  !isSelected && isActive && keyNav && 'bg-brand/[0.06]',
                  !isSelected && 'text-ink hover:bg-brand/[0.04]'
                )}
              >
                <span className="truncate">{option.label}</span>
                {isSelected && <Check size={13} className="shrink-0" />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
