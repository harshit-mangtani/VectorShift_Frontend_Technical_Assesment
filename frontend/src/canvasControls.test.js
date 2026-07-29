import { fireEvent, render, screen } from '@testing-library/react';
import { ReactFlowProvider, useStoreApi } from 'reactflow';
import { PipelineUI } from './ui';
import { useStore } from './store';
import { makeNode, resetStore } from './testUtils';

let flowApi;
const Probe = () => {
  flowApi = useStoreApi();
  return null;
};

beforeEach(() => {
  resetStore();
  useStore.setState({ nodes: [makeNode('llm', 'llm-1')] });
});

it('the lock freezes dragging, connecting and selecting together, and releases them', () => {
  render(
    <ReactFlowProvider>
      <div style={{ width: 800, height: 600 }}>
        <PipelineUI />
        <Probe />
      </div>
    </ReactFlowProvider>
  );
  const lock = () => screen.getByRole('button', { name: /(lock|unlock) canvas/i });

  fireEvent.click(lock());
  expect(flowApi.getState()).toMatchObject({
    nodesDraggable: false,
    nodesConnectable: false,
    elementsSelectable: false,
  });
  expect(lock()).toHaveAccessibleName('Unlock canvas');

  fireEvent.click(lock());
  expect(flowApi.getState()).toMatchObject({ nodesDraggable: true });
});
