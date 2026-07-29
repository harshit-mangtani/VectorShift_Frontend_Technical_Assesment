import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle } from 'lucide-react';

export const ConfirmDialog = ({
  title,
  message,
  confirmLabel = 'Delete',
  onConfirm,
  onCancel,
}) => {
  const confirmRef = useRef(null);

  useEffect(() => {
    confirmRef.current?.focus();
    const onKey = (e) => e.key === 'Escape' && onCancel();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onCancel]);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/25 p-4 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
        className="w-full max-w-sm animate-popIn rounded-2xl border border-white/70 bg-white/85
                   p-5 shadow-lift backdrop-blur-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-500/10">
            <AlertTriangle className="text-red-500" size={18} />
          </span>
          <div className="min-w-0">
            <h2 id="confirm-title" className="text-sm font-semibold">
              {title}
            </h2>
            <p id="confirm-message" className="mt-1 text-sm text-muted">
              {message}
            </p>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-xl border border-line/80 bg-white/60 px-3.5 py-2 text-sm
                       font-medium text-ink transition-all duration-200 hover:bg-white
                       active:scale-[.97]
                       focus:outline-none focus-visible:ring-4 focus-visible:ring-brand/20"
          >
            Cancel
          </button>
          <button
            ref={confirmRef}
            onClick={onConfirm}
            className="rounded-xl bg-red-500 px-3.5 py-2 text-sm font-medium text-white
                       shadow-card transition-all duration-200 hover:bg-red-600 hover:shadow-lift
                       active:scale-[.97]
                       focus:outline-none focus-visible:ring-4 focus-visible:ring-red-500/25"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
