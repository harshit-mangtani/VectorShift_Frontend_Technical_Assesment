import { fireEvent, render, screen, within } from '@testing-library/react';
import { ReactFlowProvider } from 'reactflow';
import { ClearAllButton } from './ClearAllButton';
import { PipelineUI } from '../ui';
import { useStore } from '../store';
import { makeNode, resetStore } from '../testUtils';

const canvas = () =>
  render(
    <ReactFlowProvider>
      <div style={{ width: 800, height: 600 }}>
        <PipelineUI />
      </div>
    </ReactFlowProvider>
  );

const seed = (selectedId) =>
  useStore.setState({
    nodes: [
      { ...makeNode('llm', 'llm-1'), selected: selectedId === 'llm-1' },
      { ...makeNode('text', 'text-1'), selected: selectedId === 'text-1' },
    ],
    edges: [{ id: 'e1', source: 'llm-1', target: 'text-1' }],
  });

beforeEach(resetStore);

describe('delete drop zone', () => {
  it('is disabled until something is selected', () => {
    seed();
    canvas();
    expect(screen.getByRole('button', { name: 'Delete selection' })).toBeDisabled();
  });

  it('deletes a selected connection immediately, with no confirmation', () => {
    useStore.setState({
      nodes: [makeNode('llm', 'llm-1'), makeNode('text', 'text-1')],
      edges: [
        { id: 'e1', source: 'llm-1', target: 'text-1', selected: true },
        { id: 'e2', source: 'text-1', target: 'llm-1' },
      ],
    });
    canvas();

    const bin = screen.getByRole('button', { name: 'Delete selection' });
    expect(bin).toBeEnabled();
    fireEvent.click(bin);

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(useStore.getState().edges.map((e) => e.id)).toEqual(['e2']);
    expect(useStore.getState().nodes).toHaveLength(2);
  });

  it('prefers the node when a node and a connection are both selected', () => {
    useStore.setState({
      nodes: [{ ...makeNode('llm', 'llm-1'), selected: true }],
      edges: [{ id: 'e1', source: 'llm-1', target: 'llm-1', selected: true }],
    });
    canvas();
    fireEvent.click(screen.getByRole('button', { name: 'Delete selection' }));

    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
  });

  it('asks before deleting, and does nothing if cancelled', () => {
    seed('llm-1');
    canvas();
    fireEvent.click(screen.getByRole('button', { name: 'Delete selection' }));

    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(useStore.getState().nodes).toHaveLength(2);
  });

  it('removes the node and its edges once confirmed', () => {
    seed('llm-1');
    canvas();
    fireEvent.click(screen.getByRole('button', { name: 'Delete selection' }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete node' }));

    const { nodes, edges } = useStore.getState();
    expect(nodes.map((n) => n.id)).toEqual(['text-1']);
    expect(edges).toHaveLength(0);
  });
});

describe('clear all', () => {
  it('is disabled on an empty canvas', () => {
    render(<ClearAllButton />);
    expect(screen.getByRole('button', { name: /clear all/i })).toBeDisabled();
  });

  it('asks before clearing, and does nothing if cancelled', () => {
    seed();
    render(<ClearAllButton />);
    fireEvent.click(screen.getByRole('button', { name: /clear all/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(useStore.getState().nodes).toHaveLength(2);
  });

  it('empties nodes and edges once confirmed', () => {
    seed();
    render(<ClearAllButton />);
    fireEvent.click(screen.getByRole('button', { name: /clear all/i }));

    // The header trigger and the dialog's confirm share a label, so scope the query.
    const dialog = within(screen.getByRole('alertdialog'));
    fireEvent.click(dialog.getByRole('button', { name: 'Clear all' }));

    expect(useStore.getState()).toMatchObject({ nodes: [], edges: [] });
  });
});

describe('store deletion actions', () => {
  it('removeNode drops both incoming and outgoing edges', () => {
    useStore.setState({
      nodes: [makeNode('llm', 'a'), makeNode('llm', 'b'), makeNode('llm', 'c')],
      edges: [
        { id: 'in', source: 'a', target: 'b' },
        { id: 'out', source: 'b', target: 'c' },
        { id: 'unrelated', source: 'a', target: 'c' },
      ],
    });

    useStore.getState().removeNode('b');

    expect(useStore.getState().edges.map((e) => e.id)).toEqual(['unrelated']);
  });

  it('setNodePosition restores a cancelled drag without touching data', () => {
    useStore.setState({ nodes: [makeNode('llm', 'a')] });
    const before = useStore.getState().nodes[0].data;

    useStore.getState().setNodePosition('a', { x: 42, y: 7 });

    const after = useStore.getState().nodes[0];
    expect(after.position).toEqual({ x: 42, y: 7 });
    expect(after.data).toBe(before);
  });
});
