import { useCallback, useEffect, useRef, useState } from 'react';
import { registerPending } from '../lib/pendingCommits';

/**
 * Keeps keystrokes local and commits to the store on a trailing debounce, so typing
 * does not re-render the graph on every character.
 */
export const useDebouncedField = (value, commit, delay = 150) => {
  const [local, setLocal] = useState(value);
  const timer = useRef(null);
  const latest = useRef(value);

  // Adopt external updates only when there is no edit in flight.
  useEffect(() => {
    if (timer.current === null) {
      latest.current = value;
      setLocal(value);
    }
  }, [value]);

  const flush = useCallback(() => {
    if (timer.current === null) return;
    clearTimeout(timer.current);
    timer.current = null;
    commit(latest.current);
  }, [commit]);

  useEffect(() => registerPending(flush), [flush]);
  useEffect(() => () => clearTimeout(timer.current), []);

  const onChange = useCallback(
    (next) => {
      latest.current = next;
      setLocal(next);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        timer.current = null;
        commit(next);
      }, delay);
    },
    [commit, delay]
  );

  return [local, onChange, flush];
};
