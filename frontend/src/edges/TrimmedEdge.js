import { BaseEdge, Position, getSmoothStepPath } from 'reactflow';
import { EdgeDeleteButton } from './EdgeDeleteButton';

export const GAP = 0;
const RADIUS = 8;
const STUB = GAP + RADIUS + 4;

const PULL_BACK = {
  [Position.Left]: [-GAP, 0],
  [Position.Right]: [GAP, 0],
  [Position.Top]: [0, -GAP],
  [Position.Bottom]: [0, GAP],
};

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
