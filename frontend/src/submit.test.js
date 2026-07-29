import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { SubmitButton } from './submit';
import { useStore } from './store';
import { makeNode, resetStore } from './testUtils';

const ok = (body) =>
  Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body) });

const seed = () =>
  useStore.setState({
    nodes: [makeNode('customInput', 'customInput-1'), makeNode('text', 'text-1')],
    edges: [{ id: 'e1', source: 'customInput-1', target: 'text-1' }],
  });

beforeEach(() => {
  resetStore();
  global.fetch = jest.fn(() => ok({ num_nodes: 2, num_edges: 1, is_dag: true }));
});

const submit = () => fireEvent.click(screen.getByRole('button', { name: /submit/i }));

describe('SubmitButton', () => {
  it('posts the pipeline as JSON, without React Flow render state', async () => {
    seed();
    render(<SubmitButton />);
    submit();

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    const [url, options] = global.fetch.mock.calls[0];

    expect(url).toMatch('/pipelines/parse');
    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body).nodes[0]).toEqual({
      id: 'customInput-1',
      type: 'customInput',
      data: expect.any(Object),
    });
  });

  it('shows the three values on success', async () => {
    seed();
    render(<SubmitButton />);
    submit();

    expect(await screen.findByText('Pipeline analyzed')).toBeInTheDocument();

    const stat = (name) => within(screen.getByRole('group', { name }));
    expect(stat('Nodes').getByText('2')).toBeInTheDocument();
    expect(stat('Connections').getByText('1')).toBeInTheDocument();
    expect(stat('Is DAG').getByText('Yes')).toBeInTheDocument();
  });

  it('explains why a cyclic pipeline cannot run', async () => {
    seed();
    global.fetch = jest.fn(() => ok({ num_nodes: 2, num_edges: 2, is_dag: false }));
    render(<SubmitButton />);
    submit();

    expect(await screen.findByText(/contains a cycle/i)).toBeInTheDocument();
  });

  it('reports a backend that is unreachable or unhappy', async () => {
    seed();
    global.fetch = jest.fn(() => Promise.reject(new Error('offline')));
    const { unmount } = render(<SubmitButton />);
    submit();
    expect(await screen.findByText(/could not reach the backend/i)).toBeInTheDocument();
    unmount();

    global.fetch = jest.fn(() => Promise.resolve({ ok: false, status: 500 }));
    render(<SubmitButton />);
    submit();
    expect(await screen.findByText(/returned 500/i)).toBeInTheDocument();
  });

  it('refuses an empty pipeline without calling the backend', async () => {
    render(<SubmitButton />);
    submit();

    expect(await screen.findByText(/at least one node/i)).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
