const BASE_URL = process.env.REACT_APP_API_URL ?? 'http://localhost:8000';
const TIMEOUT_MS = 10000;

export class ApiError extends Error {}
export class NetworkError extends Error {}

export const toPipelinePayload = (nodes, edges) => ({
  nodes: nodes.map(({ id, type, data }) => ({ id, type, data })),
  edges: edges.map(({ id, source, target, sourceHandle, targetHandle }) => ({
    id,
    source,
    target,
    sourceHandle,
    targetHandle,
  })),
});

export const parsePipeline = async (nodes, edges) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let response;
  try {
    response = await fetch(`${BASE_URL}/pipelines/parse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(toPipelinePayload(nodes, edges)),
      signal: controller.signal,
    });
  } catch {
    throw new NetworkError(
      `Could not reach the backend at ${BASE_URL}. Is it running?`
    );
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    throw new ApiError(`Backend returned ${response.status}. Please try again.`);
  }
  return response.json();
};
