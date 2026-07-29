import { BaseEdge, getBezierPath } from 'reactflow';
import { EdgeDeleteButton } from './EdgeDeleteButton';

export const CurvedEdge = ({ id, markerEnd, style, ...geometry }) => {
  const [path, labelX, labelY] = getBezierPath(geometry);

  return (
    <>
      <BaseEdge id={id} path={path} markerEnd={markerEnd} style={style} />
      <EdgeDeleteButton id={id} labelX={labelX} labelY={labelY} />
    </>
  );
};
