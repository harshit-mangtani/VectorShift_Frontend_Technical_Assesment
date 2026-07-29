import { useEffect } from 'react';
import { useUpdateNodeInternals } from 'reactflow';

const IDENTITY = ['', 'none', 'matrix(1, 0, 0, 1, 0, 0)'];

// React Flow measures ports with getBoundingClientRect, which includes transforms, but
// only re-measures on resize. Mid-animation reads stick forever unless refreshed here.
export const useMeasureAfterTransform = (id, ref) => {
  const updateNodeInternals = useUpdateNodeInternals();

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    const settle = (event) => {
      if (event.target !== el) return;
      if (event.type === 'transitionend' && event.propertyName !== 'transform') return;

      if (!IDENTITY.includes(window.getComputedStyle(el).transform)) return;
      updateNodeInternals(id);
    };

    el.addEventListener('animationend', settle);
    el.addEventListener('transitionend', settle);
    return () => {
      el.removeEventListener('animationend', settle);
      el.removeEventListener('transitionend', settle);
    };
  }, [id, ref, updateNodeInternals]);
};
