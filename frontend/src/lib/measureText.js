const FONT = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
// jsdom has no canvas; this keeps measurement deterministic in tests.
const FALLBACK_PX_PER_CHAR = 7;

let ctx;
const context = () => {
  if (ctx === undefined) ctx = document.createElement('canvas').getContext('2d') ?? null;
  return ctx;
};

export const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

/** Measured on one shared canvas context rather than by DOM reflow. */
const measure = (text) => {
  const canvas = context();
  if (!canvas) return text.length * FALLBACK_PX_PER_CHAR;
  canvas.font = FONT;
  return canvas.measureText(text).width;
};

export const widestLine = (text = '') =>
  Math.max(...text.split('\n').map(measure));
