import { useEffect } from 'react';
import { useUpdateNodeInternals } from 'reactflow';

const IDENTITY = ['', 'none', 'matrix(1, 0, 0, 1, 0, 0)'];

/**
 * React Flow caches each port's offset from `getBoundingClientRect()`, which folds in
 * every CSS transform on the card — but it only re-reads those offsets when the card's
 * *layout* box changes, because the trigger is a ResizeObserver and a transform never
 * fires one. So a measurement taken mid-animation is wrong by a fraction of the card's
 * own width, and nothing afterwards corrects it.
 *
 * That is what made the arrowhead gap differ per node and per Text-node size: every card
 * is measured during its 220ms entrance scale, and the error is proportional to width.
 *
 * Re-measuring once the transform settles pins the ports back to where they really are.
 */
export const useMeasureAfterTransform = (id, ref) => {
  const updateNodeInternals = useUpdateNodeInternals();

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    const settle = (event) => {
      if (event.target !== el) return;
      if (event.type === 'transitionend' && event.propertyName !== 'transform') return;
      // Mid-transform measurements are the bug, so only read a card that is at rest.
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
