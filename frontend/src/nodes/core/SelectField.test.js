import { fireEvent, screen, within } from '@testing-library/react';
import { useStore } from '../../store';
import { renderFlow, makeNode, resetStore } from '../../testUtils';

afterEach(resetStore);

const HIDDEN = { hidden: true };
const listbox = () => screen.getByRole('listbox', HIDDEN);
const queryListbox = () => screen.queryByRole('listbox', HIDDEN);

const option = (label) => {
  const match = within(listbox())
    .getAllByRole('option', HIDDEN)
    .find((el) => el.textContent.includes(label));
  if (!match) throw new Error(`No option matching "${label}"`);
  return match;
};

const model = () => screen.getByLabelText('Model');

describe('SelectField', () => {
  it('opens on click and writes the chosen value', () => {
    renderFlow([makeNode('llm', 'llm-1')]);
    fireEvent.click(model());
    fireEvent.click(option('Claude Opus'));

    expect(useStore.getState().nodes[0].data.model).toBe('claude-opus');
    expect(queryListbox()).not.toBeInTheDocument();
  });

  it('moves the highlight with arrows — only Enter commits', () => {
    renderFlow([makeNode('llm', 'llm-1')]);
    fireEvent.keyDown(model(), { key: 'ArrowDown' });
    fireEvent.keyDown(model(), { key: 'ArrowDown' });
    expect(useStore.getState().nodes[0].data.model).toBe('gpt-4o');

    fireEvent.keyDown(model(), { key: 'Enter' });
    expect(useStore.getState().nodes[0].data.model).toBe('claude-opus');
  });

  it('discards the highlight on Escape', () => {
    renderFlow([makeNode('llm', 'llm-1')]);
    fireEvent.keyDown(model(), { key: 'ArrowDown' });
    fireEvent.keyDown(model(), { key: 'Escape' });

    expect(queryListbox()).not.toBeInTheDocument();
    expect(useStore.getState().nodes[0].data.model).toBe('gpt-4o');
  });

  it('keeps its keys away from React Flow, so Enter does not select the node', () => {
    renderFlow([makeNode('llm', 'llm-1')]);
    for (const key of ['ArrowDown', 'ArrowDown', 'Enter']) {
      fireEvent.keyDown(model(), { key, bubbles: true });
    }

    expect(useStore.getState().nodes[0].data.model).toBe('claude-opus');
    expect(useStore.getState().nodes[0].selected).not.toBe(true);
  });

  it('closes on a canvas press that stops propagation, as d3-zoom does', () => {
    const { container } = renderFlow([makeNode('llm', 'llm-1')]);
    fireEvent.click(model());
    expect(queryListbox()).toBeInTheDocument();

    document.body.addEventListener('mousedown', (e) => e.stopImmediatePropagation());
    // eslint-disable-next-line testing-library/no-container
    fireEvent.mouseDown(container);

    expect(queryListbox()).not.toBeInTheDocument();
    expect(useStore.getState().nodes[0].data.model).toBe('gpt-4o');
  });

  it('drives a field that reshapes the node', () => {
    renderFlow([makeNode('filter', 'filter-1')]);
    expect(screen.getByLabelText('Value')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Condition'));
    fireEvent.click(option('is empty'));

    expect(useStore.getState().nodes[0].data.operator).toBe('is_empty');
    expect(screen.queryByLabelText('Value')).not.toBeInTheDocument();
  });
});
