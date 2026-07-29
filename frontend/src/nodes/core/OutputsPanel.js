import { useState } from 'react';
import clsx from 'clsx';
import { ChevronDown, PanelRight } from 'lucide-react';
import { TypeBadge } from './TypeBadge';

export const PANEL_WIDTH = 196;

const Row = ({ output }) => (
  <li className="space-y-0.5 border-t border-line px-2.5 py-2 first:border-t-0">
    <div className="flex items-start gap-2">
      <code className="min-w-0 flex-1 break-words font-mono text-[0.6875rem] font-semibold text-brand">
        {output.key}
      </code>
      <TypeBadge>{output.type}</TypeBadge>
    </div>
    {output.description && (
      <p className="text-[0.625rem] leading-snug text-muted">{output.description}</p>
    )}
  </li>
);

/**
 * What a node emits, beside its inputs. The pipeline's data contract is the thing you
 * most need while wiring and the thing a canvas normally hides, so it is stated on the
 * card rather than left to be discovered by connecting something and seeing what happens.
 *
 * Rarely-read fields are declared `advanced` and start collapsed, so the common case
 * stays short.
 */
export const OutputsPanel = ({ outputs }) => {
  const [open, setOpen] = useState(false);
  const primary = outputs.filter((output) => !output.advanced);
  const advanced = outputs.filter((output) => output.advanced);

  return (
    <aside
      className="flex shrink-0 flex-col border-l border-line"
      style={{ width: PANEL_WIDTH }}
    >
      <header
        className="flex items-center gap-1.5 rounded-tr-lg border-b border-brand/10
                   bg-brand/[0.055] px-2.5 py-2 text-ink"
      >
        <PanelRight size={12} strokeWidth={2.2} className="shrink-0 text-muted" />
        <p className="flex-1 text-center text-2xs font-semibold tracking-tight">Outputs</p>
      </header>

      <p className="border-b border-brand/10 bg-brand/[0.03] px-2.5 py-1.5 text-[0.625rem] leading-snug text-muted">
        Type <code className="font-mono text-ink/70">{'{{'}</code> in downstream nodes to
        leverage output fields.
      </p>

      <div className="flex items-center justify-between px-2.5 py-1.5 text-2xs font-semibold text-ink">
        <span>Output Fields</span>
        <span>Type</span>
      </div>

      {/* Outputs can be derived from a field, so the list has no bound the config
          controls — JSON Parse grows one row per key. Cap it and scroll rather than let
          one node stretch the canvas.

          `nowheel` is React Flow's opt-out: without it the pane swallows the wheel to
          zoom, and the only way to move the list is to drag its scrollbar. */}
      <ul className="nowheel thin-scroll max-h-52 overflow-y-auto border-t border-line">
        {primary.map((output) => (
          <Row key={output.key} output={output} />
        ))}
      </ul>

      {advanced.length > 0 && (
        <>
          {open && (
            <ul className="nowheel thin-scroll max-h-40 overflow-y-auto border-t border-line">
              {advanced.map((output) => (
                <Row key={output.key} output={output} />
              ))}
            </ul>
          )}

          <button
            type="button"
            onClick={() => setOpen((was) => !was)}
            aria-expanded={open}
            className="nodrag mt-auto flex items-center justify-between gap-1 rounded-br-lg
                       border-t border-brand/10 bg-brand/[0.055] px-2.5 py-1.5 text-2xs
                       font-medium text-muted transition-colors hover:text-brand
                       focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/25"
          >
            Advanced Outputs
            <ChevronDown
              size={12}
              className={clsx('transition-transform duration-200', open && 'rotate-180')}
              aria-hidden="true"
            />
          </button>
        </>
      )}
    </aside>
  );
};
