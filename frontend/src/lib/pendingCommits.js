const pending = new Set();

export const registerPending = (flush) => {
  pending.add(flush);
  return () => pending.delete(flush);
};

export const flushPending = () => pending.forEach((flush) => flush());
