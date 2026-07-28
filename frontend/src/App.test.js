import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ReactFlowProvider } from 'reactflow';
import ReactFlow from 'reactflow';
import { SubmitButton } from './submit';
import { useStore } from './store';
import { nodeTypes } from './nodes/registry';
import { makeNode, resetStore } from './testUtils';

const Workspace = () => {
  const { nodes, edges, onNodesChange } = useStore();
  return (
    <ReactFlowProvider>
      <SubmitButton />
      <div style={{ width: 800, height: 600 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          nodeTypes={nodeTypes}
        />
      </div>
    </ReactFlowProvider>
  );
};

beforeEach(() => {
  resetStore();
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ num_nodes: 1, num_edges: 0, is_dag: true }),
    })
  );
});

const submitted = () => JSON.parse(global.fetch.mock.calls[0][1].body);

describe('typing then submitting immediately', () => {
  it('sends the text just typed, not the previous value', async () => {
    useStore.setState({ nodes: [makeNode('text', 'text-1', { text: 'old' })] });
    render(<Workspace />);

    fireEvent.change(screen.getByLabelText('Text'), {
      target: { value: 'brand new' },
    });
    // No delay: the debounce is still pending when Submit is clicked.
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    expect(submitted().nodes[0].data.text).toBe('brand new');
  });

  it('sends the edited value of a plain field', async () => {
    useStore.setState({ nodes: [makeNode('customInput', 'customInput-1')] });
    render(<Workspace />);

    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'renamed' },
    });
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    expect(submitted().nodes[0].data.inputName).toBe('renamed');
  });
});
