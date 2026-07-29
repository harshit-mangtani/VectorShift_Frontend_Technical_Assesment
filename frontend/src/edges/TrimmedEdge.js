import { BaseEdge, Position, getSmoothStepPath } from 'reactflow';
import { EdgeDeleteButton } from './EdgeDeleteButton';

/**
 * Guarantees every edge meets its target head-on. getSmoothStepPath gives each end a
 * straight STUB before the path turns, and the elbow's RADIUS eats into it; keeping the
 * stub longer than the radius leaves a genuinely straight approach, so the marker —
 * which is `orient="auto"` — stays square to the card instead of following a tangent.
 *
 * GAP additionally pulls the endpoint back off the port. At 0 the arrowhead lands on the
 * port itself, which is where the port actually is now that card transforms no longer
 * corrupt React Flow's measurement of it — see hooks/useMeasureAfterTransform.
 *
 * The invariant to preserve:  GAP + RADIUS <= STUB
 */
export const GAP = 0;
const RADIUS = 8;
const STUB = GAP + RADIUS + 4;

const PULL_BACK = {
  [Position.Left]: [-GAP, 0],
  [Position.Right]: [GAP, 0],
  [Position.Top]: [0, -GAP],
  [Position.Bottom]: [0, GAP],
};

/** Pure so the geometry can be asserted without rendering. */
export const buildEdge = ({
  sourceX,
  sourceY,
  sourcePosition,
  targetX,
  targetY,
  targetPosition,
}) => {
  const [dx, dy] = PULL_BACK[targetPosition] ?? [-GAP, 0];

  const [path, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX: targetX + dx,
    targetY: targetY + dy,
    targetPosition,
    borderRadius: RADIUS,
    // Keeps the straight run at both ends longer than the trim, so the arrowhead always
    // lands on a straight approach rather than part-way round the elbow.
    offset: STUB,
  });

  return { path, labelX, labelY };
};

export const buildPath = (geometry) => buildEdge(geometry).path;

export const TrimmedEdge = ({ id, markerEnd, style, ...geometry }) => {
  const { path, labelX, labelY } = buildEdge(geometry);

  return (
    <>
      <BaseEdge id={id} path={path} markerEnd={markerEnd} style={style} />
      <EdgeDeleteButton id={id} labelX={labelX} labelY={labelY} />
    </>
  );
};
