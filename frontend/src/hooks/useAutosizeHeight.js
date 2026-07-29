import { useLayoutEffect } from 'react';

export const useAutosizeHeight = (ref, value, max = 280) => {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const frame = requestAnimationFrame(() => {
      el.style.height = 'auto';
      el.style.height = `${Math.min(el.scrollHeight, max)}px`;
    });
    return () => cancelAnimationFrame(frame);
  }, [ref, value, max]);
};
