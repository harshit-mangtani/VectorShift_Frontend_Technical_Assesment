import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, AlertTriangle, X } from 'lucide-react';

const Stat = ({ label, value, index }) => (
  <div
    role="group"
    aria-label={label}
    style={{ animationDelay: `${60 + index * 60}ms` }}
    className="animate-floatIn rounded-xl border border-white/70 bg-white/60 px-3 py-3
               text-center shadow-card"
  >
    <p className="text-xl font-semibold tabular-nums tracking-tight">{value}</p>
    <p className="mt-0.5 text-2xs uppercase tracking-wide text-muted">{label}</p>
  </div>
);

/** The alert required by Part 4, as a focus-trapped dialog rather than window.alert. */
export const ResultDialog = ({ result, error, onClose }) => {
  const closeRef = useRef(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const isDag = result?.is_dag;

  // Portalled for the same reason as ConfirmDialog: the glass header's backdrop-filter
  // would otherwise become the containing block for this fixed overlay.
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/25 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="result-title"
        className="w-full max-w-sm animate-popIn rounded-2xl border border-white/70 bg-white/85
                   p-5 shadow-lift backdrop-blur-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          {error ? (
            <AlertTriangle className="mt-0.5 shrink-0 text-red-500" size={20} />
          ) : (
            <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-500" size={20} />
          )}
          <div className="flex-1">
            <h2 id="result-title" className="text-sm font-semibold">
              {error ? 'Could not analyze pipeline' : 'Pipeline analyzed'}
            </h2>
            {error && <p className="mt-1 text-sm text-muted">{error}</p>}
          </div>
          <button
            ref={closeRef}
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1 text-muted transition-all duration-200 hover:bg-white
                       hover:text-ink active:scale-90
                       focus:outline-none focus-visible:ring-4 focus-visible:ring-brand/20"
          >
            <X size={16} />
          </button>
        </div>

        {result && (
          <>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <Stat label="Nodes" value={result.num_nodes} index={0} />
              <Stat label="Connections" value={result.num_edges} index={1} />
              <Stat label="Is DAG" value={isDag ? 'Yes' : 'No'} index={2} />
            </div>
            <p className="mt-3 text-xs text-muted">
              {isDag
                ? 'No cycles found — this pipeline can be executed.'
                : 'This pipeline contains a cycle, so it cannot be executed. Remove a connection that loops back.'}
            </p>
          </>
        )}
      </div>
    </div>,
    document.body
  );
};
