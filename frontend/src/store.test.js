import { useStore } from './store';

const reset = (state) => useStore.setState({ nodes: [], edges: [], ...state });
const node = (id, type = 'text') => ({ id, type, position: { x: 0, y: 0 }, data: {} });

beforeEach(() => reset());

describe('getNodeID', () => {
  it('counts per type, independently', () => {
    reset({ nodes: [node('text-1'), node('llm-1', 'llm')] });
    const { getNodeID } = useStore.getState();

    expect([getNodeID('text'), getNodeID('llm'), getNodeID('filter')]).toEqual([
      'text-2',
      'llm-2',
      'filter-1',
    ]);
  });

  it('reuses a freed number, filling the lowest gap', () => {
    reset({ nodes: [node('text-1'), node('text-2')] });
    expect(useStore.getState().getNodeID('text')).toBe('text-3');

    useStore.getState().removeNode('text-1');
    expect(useStore.getState().getNodeID('text')).toBe('text-1');
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

  it('leaves other nodes referentially identical, so memo holds', () => {
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
    { id: 'e4', source: 'a', target: 'z', sourceHandle: 'a-out' },
  ];
  const prune = (...args) => useStore.getState().pruneEdges(...args);

  it('drops only that node’s dead handles, on either side', () => {
    reset({ edges });
    prune('a', ['a-in-0']);
    expect(useStore.getState().edges.map((e) => e.id)).toEqual(['e1', 'e3']);
  });

  it('keeps the same array identity when nothing is removed', () => {
    reset({ edges });
    const before = useStore.getState().edges;

    prune('a', ['a-in-0', 'a-in-1', 'a-out']);

    expect(useStore.getState().edges).toBe(before);
  });
});
