import { BaseEdge, getBezierPath } from 'reactflow';
import { EdgeDeleteButton } from './EdgeDeleteButton';

/**
 * React Flow's own bezier, wrapped only so the curved mode keeps the midpoint delete.
 * Registering the built-in `default` type instead would drop it.
 */
export const CurvedEdge = ({ id, markerEnd, style, ...geometry }) => {
  const [path, labelX, labelY] = getBezierPath(geometry);

  return (
    <>
      <BaseEdge id={id} path={path} markerEnd={markerEnd} style={style} />
      <EdgeDeleteButton id={id} labelX={labelX} labelY={labelY} />
    </>
  );
};
