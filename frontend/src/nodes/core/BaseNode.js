import { useRef } from 'react';
import clsx from 'clsx';
import { NodeHandle } from './NodeHandle';
import { nodeCard, categoryChip, categoryTint } from './nodeVariants';
import { useMeasureAfterTransform } from '../../hooks/useMeasureAfterTransform';

const bySide = (handles, side) =>
  handles.filter(
    (h) => (h.position ?? (h.type === 'target' ? 'left' : 'right')) === side
  );

/** Card shell shared by every node: header, ports, body. */
export const BaseNode = ({ id, config, handles, selected, size, children }) => {
  const { label, description, icon: Icon, category } = config;
  const left = bySide(handles, 'left');
  const right = bySide(handles, 'right');
  const width = size?.width ?? 232;

  // The card is the offset parent of every port, so its transforms distort the
  // measurements React Flow builds edge geometry from.
  const cardRef = useRef(null);
  useMeasureAfterTransform(id, cardRef);

  return (
    <div
      ref={cardRef}
      className={clsx('rf-card', nodeCard({ selected }), config.className)}
      style={{ width, minHeight: size?.minHeight }}
    >
      {left.map((handle, i) => (
        <NodeHandle
          key={handle.id}
          nodeId={id}
          handle={handle}
          index={i}
          count={left.length}
        />
      ))}
      {right.map((handle, i) => (
        <NodeHandle
          key={handle.id}
          nodeId={id}
          handle={handle}
          index={i}
          count={right.length}
        />
      ))}

      {!config.bare && (
        <header
          className={clsx(
            'flex items-center gap-2.5 rounded-t-2xl bg-gradient-to-b to-transparent px-3 py-2.5',
            categoryTint[category]
          )}
        >
          <span
            className={clsx(
              'flex h-7 w-7 shrink-0 items-center justify-center rounded-[10px]',
              categoryChip[category]
            )}
          >
            <Icon size={15} strokeWidth={2.1} />
          </span>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold leading-tight tracking-tight">
              {label}
            </p>
            {description && (
              <p className="truncate text-2xs leading-tight text-muted">{description}</p>
            )}
          </div>
        </header>
      )}

      <div className={clsx('space-y-2.5 px-3 pb-3', config.bare ? 'pt-3' : 'pt-0.5')}>
        {children}
      </div>
    </div>
  );
};
