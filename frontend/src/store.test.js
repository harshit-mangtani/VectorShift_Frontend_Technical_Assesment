import { useStore } from './store';

const reset = (state) => useStore.setState({ nodes: [], edges: [], ...state });

const node = (id) => ({ id, type: 'text', position: { x: 0, y: 0 }, data: {} });

beforeEach(() => reset());

describe('getNodeID', () => {
  const typed = (id, type) => ({ id, type, position: { x: 0, y: 0 }, data: {} });

  it('counts per type, independently', () => {
    reset({ nodes: [typed('text-1', 'text'), typed('llm-1', 'llm')] });
    const { getNodeID } = useStore.getState();

    expect([getNodeID('text'), getNodeID('llm'), getNodeID('filter')]).toEqual([
      'text-2',
      'llm-2',
      'filter-1',
    ]);
  });

  it('reuses the number once its node is gone', () => {
    reset({ nodes: [typed('text-1', 'text'), typed('text-2', 'text')] });
    expect(useStore.getState().getNodeID('text')).toBe('text-3');

    useStore.getState().removeNode('text-1');
    expect(useStore.getState().getNodeID('text')).toBe('text-1');
  });

  it('fills the lowest gap rather than appending', () => {
    reset({
      nodes: [typed('text-1', 'text'), typed('text-3', 'text'), typed('text-4', 'text')],
    });
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
