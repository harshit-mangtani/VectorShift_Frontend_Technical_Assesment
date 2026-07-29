import { useRef } from 'react';
import clsx from 'clsx';
import { X } from 'lucide-react';
import { useStore } from '../../store';
import { NodeHandle } from './NodeHandle';
import { OutputsPanel } from './OutputsPanel';
import { nodeCard, nodeChip } from './nodeVariants';
import { useMeasureAfterTransform } from '../../hooks/useMeasureAfterTransform';

const bySide = (handles, side) =>
  handles.filter(
    (h) => (h.position ?? (h.type === 'target' ? 'left' : 'right')) === side
  );

export const BaseNode = ({
  id,
  config,
  handles,
  outputs = [],
  selected,
  size,
  children,
}) => {
  const { label, description, icon: Icon } = config;
  const requestDelete = useStore((s) => s.requestDelete);
  const left = bySide(handles, 'left');
  const right = bySide(handles, 'right');
  const width = size?.width ?? 232;
  const hasOutputs = outputs.length > 0;

  // The card is every port's offset parent, so its transforms skew their measurement.
  const cardRef = useRef(null);
  useMeasureAfterTransform(id, cardRef);

  return (
    <div
      ref={cardRef}
      className={clsx('rf-card flex', nodeCard({ selected }), config.className)}
      style={{ minHeight: size?.minHeight }}
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

      {/* Width sits on the body column: with an outputs panel the card is the sum. */}
      <div className="flex min-w-0 flex-col" style={{ width }}>
        {!config.bare && (
          <div
            className={clsx(
              'space-y-1.5 border-b border-brand/10 bg-brand/[0.055] px-2.5 py-2',
              hasOutputs ? 'rounded-tl-lg' : 'rounded-t-lg'
            )}
          >
            <div className="flex items-start gap-2">
              <span
                className={clsx(
                  'mt-px flex h-6 w-6 shrink-0 items-center justify-center rounded-md',
                  nodeChip
                )}
              >
                <Icon size={13} strokeWidth={2.2} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold leading-tight tracking-tight">
                  {label}
                </p>
                {description && (
                  <p className="mt-0.5 text-2xs leading-snug text-muted">{description}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => requestDelete(id)}
                title="Delete this node"
                aria-label={`Delete ${label}`}
                className="nodrag -mr-0.5 shrink-0 rounded-full p-0.5 text-muted/70
                           transition-colors hover:bg-red-500/10 hover:text-red-500
                           focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30"
              >
                <X size={13} strokeWidth={2.4} />
              </button>
            </div>

              <p
              className="truncate rounded bg-brand/[0.11] px-2 py-0.5 text-center font-mono
                         text-[0.6875rem] leading-4 text-ink/80"
              title={id}
            >
              {id}
            </p>
          </div>
        )}

        <div className={clsx('space-y-2 px-2.5 pb-2.5', config.bare ? 'pt-2.5' : 'pt-2')}>
          {children}
        </div>
      </div>

      {hasOutputs && <OutputsPanel outputs={outputs} />}
    </div>
  );
};
