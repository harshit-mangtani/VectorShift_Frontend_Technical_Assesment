import { useCallback, useState } from 'react';
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

    // Debounced edits must land before we read state, or we submit stale data.
    flushPending();
    // Read non-reactively: this button has no reason to re-render as the graph changes.
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
      <button
        type="submit"
        onClick={onSubmit}
        disabled={pending}
        className="inline-flex h-9 items-center gap-2 rounded-xl bg-gradient-to-br from-brand
                   to-cat-llm px-3.5 text-sm font-medium text-white shadow-card
                   transition-all duration-200 hover:shadow-lift hover:brightness-105
                   active:scale-[.97] disabled:cursor-not-allowed disabled:opacity-70
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
