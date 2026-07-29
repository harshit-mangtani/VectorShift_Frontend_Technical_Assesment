export const EDGE_TYPE = { straight: 'trimmed', curved: 'curved' };
export const CONNECTION_LINE = { straight: 'smoothstep', curved: 'bezier' };

export const shapeEdges = (edges, shape) => {
  const type = EDGE_TYPE[shape];
  return edges.map((edge) => (edge.type === type ? edge : { ...edge, type }));
};
