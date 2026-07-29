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

describe('deleting a node', () => {
  // Inside a React Flow node an accessible name computes to "" — jsdom never measures it.
  const cross = () => screen.getAllByTitle('Delete this node')[0];

  it('confirms, then removes the node and its connections', () => {
    seed();
    canvas();

    fireEvent.click(cross());
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(useStore.getState().nodes).toHaveLength(2);

    fireEvent.click(screen.getByRole('button', { name: 'Delete node' }));
    expect(ids()).toEqual(['text-1']);
    expect(useStore.getState().edges).toHaveLength(0);
  });

  it('changes nothing when cancelled', () => {
    seed();
    canvas();

    fireEvent.click(cross());
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(useStore.getState().nodes).toHaveLength(2);
    expect(useStore.getState().pendingDeleteId).toBeNull();
  });

  it('is also reachable by Delete on a selection', () => {
    seed('llm-1');
    canvas();

    press('Delete');
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
  });

  it('is not bound to Backspace, which is an editing key first', () => {
    seed('llm-1');
    canvas();

    press('Backspace');
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('ignores Delete while a field has focus', () => {
    seed('text-1');
    canvas();

    press('Delete', screen.getByLabelText('Text'));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });
});

describe('deleting a connection', () => {
  it('goes without a dialog when selected and Delete is pressed', () => {
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

  it('goes without a dialog from its own midpoint button', () => {
    useStore.setState({
      nodes: [],
      edges: [
        { id: 'e1', source: 'a', target: 'b' },
        { id: 'e2', source: 'b', target: 'c' },
      ],
    });
    // The button portals into React Flow's edge-label layer, so a live flow must exist.
    render(
      <ReactFlowProvider>
        <div style={{ width: 800, height: 600 }}>
          <ReactFlow nodes={[]} edges={[]} />
          <EdgeDeleteButton id="e1" labelX={40} labelY={40} />
        </div>
      </ReactFlowProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Delete this connection' }));
    expect(useStore.getState().edges.map((e) => e.id)).toEqual(['e2']);
  });
});

describe('clear all', () => {
  it('is disabled on an empty canvas', () => {
    render(<ClearAllButton />);
    expect(screen.getByRole('button', { name: /clear all/i })).toBeDisabled();
  });

  it('empties nodes and edges once confirmed', () => {
    seed();
    render(<ClearAllButton />);
    fireEvent.click(screen.getByRole('button', { name: /clear all/i }));

    // The trigger and the dialog's confirm share a label, so scope the query.
    const dialog = within(screen.getByRole('alertdialog'));
    fireEvent.click(dialog.getByRole('button', { name: 'Clear all' }));

    expect(useStore.getState()).toMatchObject({ nodes: [], edges: [] });
  });
});
