import { useStore } from './store';

const reset = (state) =>
  useStore.setState({ nodes: [], edges: [], nodeIDs: {}, ...state });

const node = (id) => ({ id, type: 'text', position: { x: 0, y: 0 }, data: {} });

beforeEach(() => reset());

describe('getNodeID', () => {
  it('increments per type', () => {
    const { getNodeID } = useStore.getState();
    expect([getNodeID('text'), getNodeID('text'), getNodeID('llm')]).toEqual([
      'text-1',
      'text-2',
      'llm-1',
    ]);
  });

  it('does not reuse an id after the node is deleted', () => {
    const { getNodeID } = useStore.getState();
    getNodeID('text');
    reset({ nodeIDs: useStore.getState().nodeIDs });
    expect(useStore.getState().getNodeID('text')).toBe('text-2');
  });
});

describe('updateNodeField', () => {
  it('replaces the edited node immutably', () => {
    reset({ nodes: [node('a')] });
    const before = useStore.getState().nodes[0];

    useStore.getState().updateNodeField('a', 'text', 'hello');
    const after = useStore.getState().nodes[0];

    expect(after.data.text).toBe('hello');
    expect(after).not.toBe(before);
    expect(after.data).not.toBe(before.data);
  });

  it('leaves other nodes referentially identical so memo holds', () => {
    reset({ nodes: [node('a'), node('b')] });
    const untouched = useStore.getState().nodes[1];

    useStore.getState().updateNodeField('a', 'text', 'hello');

    expect(useStore.getState().nodes[1]).toBe(untouched);
  });
});

describe('pruneEdges', () => {
  const edges = [
    { id: 'e1', source: 'x', target: 'a', targetHandle: 'a-in-0' },
    { id: 'e2', source: 'x', target: 'a', targetHandle: 'a-in-1' },
    { id: 'e3', source: 'x', target: 'b', targetHandle: 'b-in-0' },
  ];
  const prune = (...args) => useStore.getState().pruneEdges(...args);

  it('drops edges whose handle no longer exists on that node', () => {
    reset({ edges });
    prune('a', ['a-in-0']);
    expect(useStore.getState().edges.map((e) => e.id)).toEqual(['e1', 'e3']);
  });

  it('leaves other nodes edges untouched', () => {
    reset({ edges });
    prune('a', ['a-in-0', 'a-in-1']);
    expect(useStore.getState().edges).toHaveLength(3);
  });

  it('keeps the same array identity when nothing is removed', () => {
    reset({ edges });
    const before = useStore.getState().edges;
    prune('a', ['a-in-0', 'a-in-1']);
    expect(useStore.getState().edges).toBe(before);
  });

  it('prunes a removed source handle too', () => {
    reset({ edges: [{ id: 'e1', source: 'a', sourceHandle: 'a-out', target: 'z' }] });
    prune('a', []);
    expect(useStore.getState().edges).toHaveLength(0);
  });
});
