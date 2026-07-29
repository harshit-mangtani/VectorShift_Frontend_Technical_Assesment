import { fireEvent, render, screen } from '@testing-library/react';
import ReactFlow, { ReactFlowProvider } from 'reactflow';
import { PipelineToolbar } from './toolbar';
import { useAddNode } from './hooks/useAddNode';
import { useStore } from './store';
import { nodeConfigs, nodeTypes } from './nodes/registry';
import { resetStore } from './testUtils';

const Inner = () => {
  const addNode = useAddNode();
  const nodes = useStore((s) => s.nodes);
  return (
    <>
      <PipelineToolbar onAdd={addNode} />
      <div style={{ width: 800, height: 600 }}>
        <ReactFlow nodes={nodes} nodeTypes={nodeTypes} />
      </div>
    </>
  );
};

const Harness = () => (
  <ReactFlowProvider>
    <Inner />
  </ReactFlowProvider>
);

const rail = () => screen.getByRole('complementary', { name: 'Node library' });
const isOpen = () => rail().className.includes('w-[min(228px');
const entry = (name) => screen.getByRole('button', { name });

beforeEach(resetStore);

describe('node library', () => {
  it('lists every registered node', () => {
    render(<Harness />);
    for (const config of nodeConfigs) {
      expect(entry(config.label)).toBeInTheDocument();
    }
  });

  it('filters as you search, and forgets the filter once closed', () => {
    render(<Harness />);
    fireEvent.mouseEnter(rail());
    fireEvent.change(screen.getByPlaceholderText('Search nodes'), {
      target: { value: 'filt' },
    });
    expect(entry('Filter')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Webhook' })).not.toBeInTheDocument();

    fireEvent.mouseLeave(rail());
    expect(entry('Webhook')).toBeInTheDocument();
  });

  it('adds a seeded node when a library item is clicked', () => {
    render(<Harness />);
    fireEvent.click(entry('Filter'));

    const { nodes } = useStore.getState();
    expect(nodes).toHaveLength(1);
    expect(nodes[0]).toMatchObject({ id: 'filter-1', type: 'filter' });
    expect(nodes[0].data.operator).toBe('equals');
  });

  it('gives each added node a unique id and its own position', () => {
    render(<Harness />);
    for (let i = 0; i < 3; i += 1) fireEvent.click(entry('Filter'));

    const { nodes } = useStore.getState();
    expect(nodes.map((n) => n.id)).toEqual(['filter-1', 'filter-2', 'filter-3']);
    const seen = nodes.map((n) => `${n.position.x},${n.position.y}`);
    expect(new Set(seen).size).toBe(seen.length);
  });

  it('expands on hover and on keyboard focus', () => {
    render(<Harness />);
    expect(isOpen()).toBe(false);

    fireEvent.mouseEnter(rail());
    expect(isOpen()).toBe(true);
    fireEvent.mouseLeave(rail());
    expect(isOpen()).toBe(false);

    fireEvent.focus(entry('Filter'));
    expect(isOpen()).toBe(true);
  });

  it('stays open while pinned, and hands back to hover when unpinned', () => {
    render(<Harness />);
    fireEvent.mouseEnter(rail());
    fireEvent.click(entry(/keep node library open/i));
    fireEvent.mouseLeave(rail());
    expect(isOpen()).toBe(true);

    fireEvent.click(entry(/unpin node library/i));
    fireEvent.mouseLeave(rail());
    expect(isOpen()).toBe(false);
  });
});
