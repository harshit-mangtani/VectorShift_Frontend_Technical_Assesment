import { Position } from 'reactflow';
import { GAP, buildPath } from './TrimmedEdge';

const path = (props) =>
  buildPath({
    sourceX: 0,
    sourceY: 0,
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
    ...props,
  });

const points = (d) => {
  const numbers = d.match(/-?\d+(\.\d+)?/g).map(Number);
  const pairs = [];
  for (let i = 0; i < numbers.length; i += 2) {
    pairs.push({ x: numbers[i], y: numbers[i + 1] });
  }
  return pairs;
};

const end = (d) => points(d).at(-1);
const beforeEnd = (d) => points(d).at(-2);

describe('TrimmedEdge geometry', () => {
  it('stops GAP short of a left-facing target', () => {
    const d = path({ targetX: 300, targetY: 0 });
    expect(300 - end(d).x).toBe(GAP);
  });

  it('trims along the correct axis for a top-facing target', () => {
    const d = path({ targetX: 200, targetY: 300, targetPosition: Position.Top });
    expect(300 - end(d).y).toBe(GAP);
  });

  it('trims identically however the path has to route', () => {
    const straight = path({ targetX: 300, targetY: 0 });
    const stepped = path({ targetX: 300, targetY: 160 });
    const backwards = path({ targetX: -200, targetY: 90 });

    expect(300 - end(straight).x).toBe(GAP);
    expect(300 - end(stepped).x).toBe(GAP);
    expect(-200 - end(backwards).x).toBe(GAP);
  });

  /**
   * The marker is `orient="auto"`, so it points along the final segment. If that
   * segment were part of the elbow the arrowhead would arrive at an angle — this is
   * what keeps it perpendicular to the card on every node.
   */
  it('approaches the target along a straight, axis-aligned run', () => {
    for (const targetY of [0, 6, 40, 160, -240]) {
      const d = path({ targetX: 300, targetY });
      expect(beforeEnd(d).y).toBe(end(d).y);
      expect(beforeEnd(d).x).toBeLessThan(end(d).x);
    }
  });
});
