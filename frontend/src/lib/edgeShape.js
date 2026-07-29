// 'straight' is the trimmed step edge; 'curved' wraps React Flow's bezier. Both are
// custom types so either shape keeps its midpoint delete button.
export const EDGE_TYPE = { straight: 'trimmed', curved: 'curved' };
export const CONNECTION_LINE = { straight: 'smoothstep', curved: 'bezier' };

/**
 * Stamps the current shape onto every edge at render time, so switching re-routes the
 * connections already on the canvas. Edges that already match keep their identity, which
 * is what stops React Flow re-rendering the whole graph on an unrelated change.
 */
export const shapeEdges = (edges, shape) => {
  const type = EDGE_TYPE[shape];
  return edges.map((edge) => (edge.type === type ? edge : { ...edge, type }));
};
