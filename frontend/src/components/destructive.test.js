import { fireEvent, render, screen, within } from '@testing-library/react';
import ReactFlow, { ReactFlowProvider } from 'reactflow';
import { ClearAllButton } from './ClearAllButton';
import { EdgeDeleteButton } from '../edges/EdgeDeleteButton';
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

const press = (key, target = document.body) => fireEvent.keyDown(target, { key });
const ids = () => useStore.getState().nodes.map((n) => n.id);

beforeEach(resetStore);

describe('the card’s own ✕', () => {
  // Inside a React Flow node an accessible name computes to "" — jsdom never measures the
  // node, so it stays visibility:hidden. The title attribute is unaffected.
  const cross = () => screen.getByTitle('Delete this node');

  it('asks before deleting', () => {
    useStore.setState({ nodes: [makeNode('llm', 'llm-1')], edges: [] });
    canvas();

    fireEvent.click(cross());

    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(useStore.getState().nodes).toHaveLength(1);
  });

  it('deletes the node it belongs to, selected or not', () => {
    seed();
    canvas();

    fireEvent.click(screen.getAllByTitle('Delete this node')[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Delete node' }));

    expect(ids()).toEqual(['text-1']);
    expect(useStore.getState().edges).toHaveLength(0);
  });

  it('leaves everything alone when cancelled', () => {
    useStore.setState({ nodes: [makeNode('llm', 'llm-1')], edges: [] });
    canvas();

    fireEvent.click(cross());
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(useStore.getState().nodes).toHaveLength(1);
    expect(useStore.getState().pendingDeleteId).toBeNull();
  });
});

describe('the Delete key', () => {
  it('asks first when a node is selected', () => {
    seed('llm-1');
    canvas();

    press('Delete');

    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(useStore.getState().nodes).toHaveLength(2);
  });

  // Backspace is an editing key first. Bound canvas-wide, one stray press outside a
  // field would cost a node.
  it('is not joined by Backspace', () => {
    seed('llm-1');
    canvas();

    press('Backspace');

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(useStore.getState().nodes).toHaveLength(2);
  });

  it('removes the node and its connections once confirmed', () => {
    seed('llm-1');
    canvas();

    press('Delete');
    fireEvent.click(screen.getByRole('button', { name: 'Delete node' }));

    expect(ids()).toEqual(['text-1']);
    expect(useStore.getState().edges).toHaveLength(0);
  });

  it('keeps the node when the dialog is cancelled', () => {
    seed('llm-1');
    canvas();

    press('Delete');
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(ids()).toEqual(['llm-1', 'text-1']);
  });

  it('drops a selected connection outright, with no dialog', () => {
    useStore.setState({
      nodes: [makeNode('llm', 'llm-1')],
      edges: [
        { id: 'e1', source: 'llm-1', target: 'llm-1', selected: true },
        { id: 'e2', source: 'llm-1', target: 'llm-1' },
      ],
    });
    canvas();

    press('Delete');

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(useStore.getState().edges.map((e) => e.id)).toEqual(['e2']);
  });

  it('prefers the node when a node and a connection are both selected', () => {
    useStore.setState({
      nodes: [{ ...makeNode('llm', 'llm-1'), selected: true }],
      edges: [{ id: 'e1', source: 'llm-1', target: 'llm-1', selected: true }],
    });
    canvas();

    press('Delete');

    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(useStore.getState().edges).toHaveLength(1);
  });

  it('does nothing with an empty selection', () => {
    seed();
    canvas();

    press('Delete');

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(useStore.getState().nodes).toHaveLength(2);
  });

  it('is ignored while a field has focus', () => {
    seed('text-1');
    canvas();

    press('Delete', screen.getByLabelText('Text'));

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(useStore.getState().nodes).toHaveLength(2);
  });
});

describe('the connection’s own ✕', () => {
  // The button portals into React Flow's edge-label layer, so a live flow has to exist.
  const withFlow = (id) =>
    render(
      <ReactFlowProvider>
        <div style={{ width: 800, height: 600 }}>
          <ReactFlow nodes={[]} edges={[]} />
          <EdgeDeleteButton id={id} labelX={40} labelY={40} />
        </div>
      </ReactFlowProvider>
    );

  it('removes that connection and no other, without confirming', () => {
    useStore.setState({
      nodes: [],
      edges: [
        { id: 'e1', source: 'a', target: 'b' },
        { id: 'e2', source: 'b', target: 'c' },
      ],
    });
    withFlow('e1');

    fireEvent.click(screen.getByRole('button', { name: 'Delete this connection' }));

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(useStore.getState().edges.map((e) => e.id)).toEqual(['e2']);
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
});
