import { screen } from '@testing-library/react';
import { nodeConfigs, nodeTypes, initialNodeData } from './registry';
import { resolveHandles } from './core/createNode';
import { renderFlow, makeNode, resetStore, handleIds } from '../testUtils';

afterEach(resetStore);

// One test for every node type: whatever the registry declares, the canvas must render.
describe.each(nodeConfigs.map((c) => [c.type, c]))('%s node', (type, config) => {
  const id = `${type}-1`;
  const data = initialNodeData(type, id);

  it('is registered for React Flow', () => {
    expect(nodeTypes[type]).toBeDefined();
  });

  it('seeds every declared field into node.data', () => {
    for (const field of config.fields ?? []) {
      expect(data).toHaveProperty(field.key);
    }
  });

  it('renders its declared handles', () => {
    const { container } = renderFlow([makeNode(type, id)]);
    const expected = resolveHandles(config, data).map((h) => `${id}-${h.id}`);

    expect(handleIds(container).sort()).toEqual(expected.sort());
  });

  it('renders a labelled control for every visible field', () => {
    renderFlow([makeNode(type, id)]);
    const visible = (config.fields ?? []).filter(
      (f) => !f.visibleIf || f.visibleIf(data)
    );
    for (const field of visible) {
      expect(screen.getByLabelText(field.label)).toBeInTheDocument();
    }
  });

  it('shows its title unless it opts out of the header', () => {
    renderFlow([makeNode(type, id)]);
    if (config.bare) return;
    // getAllBy: a node's title can legitimately match one of its own field labels.
    expect(screen.getAllByText(config.label).length).toBeGreaterThan(0);
  });
});
