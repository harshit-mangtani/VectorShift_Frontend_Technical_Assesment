import { useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import { Play } from 'lucide-react';
import { useStore } from './store';
import { parsePipeline } from './lib/api';
import { flushPending } from './lib/pendingCommits';
import { ResultDialog } from './components/ResultDialog';
import { LoadingDots } from './components/LoadingDots';

export const SubmitButton = () => {
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const onSubmit = useCallback(async () => {
    if (pending) return;

    // Debounced edits must land before the graph is read, or we submit stale data.
    flushPending();

    const { nodes, edges } = useStore.getState();

    if (nodes.length === 0) {
      setError('Add at least one node before submitting.');
      return;
    }

    setPending(true);
    setError(null);
    try {
      setResult(await parsePipeline(nodes, edges));
    } catch (e) {
      setError(e.message);
    } finally {
      setPending(false);
    }
  }, [pending]);

  const close = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return (
    <>
      {pending &&
        createPortal(
          <div
            className="fixed inset-0 z-40 cursor-progress bg-white/25 backdrop-blur-[1px]"
            aria-hidden="true"
          />,
          document.body
        )}

      <button
        type="submit"
        onClick={onSubmit}
        disabled={pending}
        aria-busy={pending}
        className="inline-flex h-9 items-center gap-2 rounded-xl bg-brand px-3.5 text-sm
                   font-medium text-white shadow-card transition-all duration-200
                   hover:bg-brand-hover hover:shadow-lift active:scale-[.97]
                   disabled:cursor-not-allowed disabled:opacity-70
                   focus:outline-none focus-visible:ring-4 focus-visible:ring-brand/25"
      >
        {pending ? <LoadingDots /> : <Play size={14} strokeWidth={2.4} />}
        {pending ? 'Analyzing' : 'Submit'}
      </button>

      {(result || error) && (
        <ResultDialog result={result} error={error} onClose={close} />
      )}
    </>
  );
};
