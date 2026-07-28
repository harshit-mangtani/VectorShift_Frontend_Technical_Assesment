import { useCallback, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useStore } from '../store';
import { ConfirmDialog } from './ConfirmDialog';

export const ClearAllButton = () => {
  const [confirming, setConfirming] = useState(false);
  const count = useStore((s) => s.nodes.length);
  const clearAll = useStore((s) => s.clearAll);

  const confirm = useCallback(() => {
    clearAll();
    setConfirming(false);
  }, [clearAll]);

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        disabled={count === 0}
        title="Remove every node and connection"
        className="inline-flex h-9 items-center gap-2 rounded-xl border border-line/80
                   bg-white/60 px-2.5 text-sm font-medium text-muted backdrop-blur
                   transition-all duration-200 hover:border-red-200 hover:bg-red-50/80
                   hover:text-red-600 active:scale-[.97]
                   disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:border-line/80
                   disabled:hover:bg-white/60 disabled:hover:text-muted
                   focus:outline-none focus-visible:ring-4 focus-visible:ring-red-500/15 sm:px-3"
      >
        <Trash2 size={15} />
        <span className="hidden sm:inline">Clear all</span>
      </button>

      {confirming && (
        <ConfirmDialog
          title="Clear the whole pipeline?"
          message={`All ${count} node${count === 1 ? '' : 's'} and their connections
                    will be removed. This can't be undone.`}
          confirmLabel="Clear all"
          onConfirm={confirm}
          onCancel={() => setConfirming(false)}
        />
      )}
    </>
  );
};
