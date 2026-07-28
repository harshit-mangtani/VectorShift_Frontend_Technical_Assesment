import { fireEvent, render, screen } from '@testing-library/react';
import ReactFlow, { ReactFlowProvider } from 'reactflow';
import { PipelineToolbar } from './toolbar';
import { useAddNode } from './hooks/useAddNode';
import { useStore } from './store';
import { nodeConfigs, nodeTypes } from './nodes/registry';
import { resetStore } from './testUtils';

// Exercises the real add path: toolbar -> useAddNode -> useReactFlow -> store.
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

beforeEach(resetStore);

describe('node library', () => {
  it('lists every registered node', () => {
    render(<Harness />);
    for (const config of nodeConfigs) {
      expect(screen.getByRole('button', { name: config.label })).toBeInTheDocument();
    }
  });

  it('filters as you search', () => {
    render(<Harness />);
    fireEvent.change(screen.getByPlaceholderText('Search nodes'), {
      target: { value: 'filt' },
    });

    expect(screen.getByRole('button', { name: 'Filter' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Database' })).not.toBeInTheDocument();
  });

  it('adds a node to the store when a library item is clicked', () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'Filter' }));

    const { nodes } = useStore.getState();
    expect(nodes).toHaveLength(1);
    expect(nodes[0].type).toBe('filter');
    expect(nodes[0].id).toBe('filter-1');
    expect(nodes[0].data.operator).toBe('equals');
  });

  describe('expand behaviour', () => {
    const rail = () => screen.getByRole('complementary', { name: 'Node library' });
    const isOpen = () => rail().className.includes('w-[min(228px');

    it('starts collapsed and expands on hover', () => {
      render(<Harness />);
      expect(isOpen()).toBe(false);

      fireEvent.mouseEnter(rail());
      expect(isOpen()).toBe(true);

      fireEvent.mouseLeave(rail());
      expect(isOpen()).toBe(false);
    });

    it('expands when focus enters, so keyboard users are not stuck', () => {
      render(<Harness />);
      fireEvent.focus(screen.getByRole('button', { name: 'Filter' }));
      expect(isOpen()).toBe(true);
    });

    it('stays expanded on hover-out once pinned, and collapses when unpinned', () => {
      render(<Harness />);
      fireEvent.mouseEnter(rail());
      fireEvent.click(screen.getByRole('button', { name: /keep node library open/i }));

      fireEvent.mouseLeave(rail());
      expect(isOpen()).toBe(true);

      fireEvent.click(screen.getByRole('button', { name: /unpin node library/i }));
      fireEvent.mouseLeave(rail());
      expect(isOpen()).toBe(false);
    });

    it('hands control back to hover when unpinned, rather than closing outright', () => {
      render(<Harness />);
      fireEvent.mouseEnter(rail());
      fireEvent.click(screen.getByRole('button', { name: /keep node library open/i }));
      fireEvent.click(screen.getByRole('button', { name: /unpin node library/i }));

      // Pointer is still inside, so it stays open …
      expect(isOpen()).toBe(true);

      // … and closes on hover-out, without needing a click elsewhere.
      fireEvent.mouseLeave(rail());
      expect(isOpen()).toBe(false);
    });

    it('collapses immediately when the mobile chevron is used to close it', () => {
      render(<Harness />);
      const open = screen.getByRole('button', { name: 'Expand node library' });
      fireEvent.click(open);
      expect(isOpen()).toBe(true);

      fireEvent.click(screen.getByRole('button', { name: 'Collapse node library' }));
      expect(isOpen()).toBe(false);
    });

    it('holds the list height steady while filtering', () => {
      render(<Harness />);
      fireEvent.mouseEnter(rail());
      const list = screen.getByTestId('node-list');
      expect(list.style.minHeight).toBe('');

      fireEvent.change(screen.getByPlaceholderText('Search nodes'), {
        target: { value: 'filt' },
      });
      expect(list.style.minHeight).not.toBe('');

      // Clearing the query releases the lock.
      fireEvent.change(screen.getByPlaceholderText('Search nodes'), {
        target: { value: '' },
      });
      expect(list.style.minHeight).toBe('');
    });

    it('offers a chevron toggle for touch devices, where hover does not exist', () => {
      render(<Harness />);
      const chevron = screen.getByRole('button', { name: 'Expand node library' });
      expect(chevron).toHaveAttribute('aria-expanded', 'false');

      fireEvent.click(chevron);
      expect(isOpen()).toBe(true);
      expect(
        screen.getByRole('button', { name: 'Collapse node library' })
      ).toHaveAttribute('aria-expanded', 'true');
    });

    it('clears a stale search filter when it closes', () => {
      render(<Harness />);
      fireEvent.mouseEnter(rail());
      fireEvent.change(screen.getByPlaceholderText('Search nodes'), {
        target: { value: 'filt' },
      });
      expect(screen.queryByRole('button', { name: 'Database' })).not.toBeInTheDocument();

      fireEvent.mouseLeave(rail());
      expect(screen.getByRole('button', { name: 'Database' })).toBeInTheDocument();
    });
  });

  it('gives each added node a unique id', () => {
    render(<Harness />);
    const filter = screen.getByRole('button', { name: 'Filter' });
    fireEvent.click(filter);
    fireEvent.click(filter);

    expect(useStore.getState().nodes.map((n) => n.id)).toEqual([
      'filter-1',
      'filter-2',
    ]);
  });

  it('cascades click-added nodes instead of stacking them', () => {
    render(<Harness />);
    const filter = screen.getByRole('button', { name: 'Filter' });
    for (let i = 0; i < 5; i += 1) fireEvent.click(filter);

    const seen = useStore
      .getState()
      .nodes.map((n) => `${n.position.x},${n.position.y}`);

    expect(new Set(seen).size).toBe(seen.length);
  });
});
