import { clamp, widestLine } from './measureText';

// jsdom has no canvas, so measurement falls back to 7px per character.
const PX_PER_CHAR = 7;

describe('clamp', () => {
  it('bounds a value on both sides', () => {
    expect(clamp(5, 10, 20)).toBe(10);
    expect(clamp(25, 10, 20)).toBe(20);
    expect(clamp(15, 10, 20)).toBe(15);
  });
});

describe('widestLine', () => {
  it('measures a single line', () => {
    expect(widestLine('abcd')).toBe(4 * PX_PER_CHAR);
  });

  it('returns the widest of several lines, not the total', () => {
    expect(widestLine('ab\nabcdef\nabc')).toBe(6 * PX_PER_CHAR);
  });

  it('treats empty and missing input as zero width', () => {
    expect(widestLine('')).toBe(0);
    expect(widestLine()).toBe(0);
  });
});
