import { fireEvent, render, screen } from '@testing-library/react';
import { ReactFlowProvider, useStoreApi } from 'reactflow';
import { PipelineUI } from './ui';
import { useStore } from './store';
import { makeNode, resetStore } from './testUtils';

// React Flow's own store, reached the way a component would.
let flowApi;
const Probe = () => {
  flowApi = useStoreApi();
  return null;
};

const canvas = () =>
  render(
    <ReactFlowProvider>
      <div style={{ width: 800, height: 600 }}>
        <PipelineUI />
        <Probe />
      </div>
    </ReactFlowProvider>
  );

beforeEach(() => {
  resetStore();
  useStore.setState({ nodes: [makeNode('llm', 'llm-1')] });
});

describe('canvas lock', () => {
  const lock = () => screen.getByRole('button', { name: /(lock|unlock) canvas/i });

  it('starts unlocked', () => {
    canvas();
    expect(lock()).toHaveAccessibleName('Lock canvas');
    expect(lock()).toHaveAttribute('aria-pressed', 'false');
  });

  it('freezes dragging, connecting and selecting together', () => {
    canvas();
    fireEvent.click(lock());

    expect(flowApi.getState()).toMatchObject({
      nodesDraggable: false,
      nodesConnectable: false,
      elementsSelectable: false,
    });
  });

  it('reports its state, and releases everything again', () => {
    canvas();

    fireEvent.click(lock());
    expect(lock()).toHaveAccessibleName('Unlock canvas');
    expect(lock()).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(lock());
    expect(flowApi.getState()).toMatchObject({
      nodesDraggable: true,
      nodesConnectable: true,
      elementsSelectable: true,
    });
    expect(lock()).toHaveAccessibleName('Lock canvas');
  });
});
