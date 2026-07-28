// Debounced fields register a flush here so Submit can force pending edits into the
// store before serialising. Without it, typing then immediately submitting sends stale data.
const pending = new Set();

export const registerPending = (flush) => {
  pending.add(flush);
  return () => pending.delete(flush);
};

export const flushPending = () => pending.forEach((flush) => flush());
