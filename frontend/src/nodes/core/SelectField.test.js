import { fireEvent, screen, within } from '@testing-library/react';
import { useStore } from '../../store';
import { renderFlow, makeNode, resetStore, handleIds } from '../../testUtils';

afterEach(resetStore);

// React Flow keeps a node at `visibility: hidden` until it has measured it, and jsdom
// never fires ResizeObserver — so anything inside a node is outside the accessibility
// tree here. Role queries have to opt into hidden elements.
const HIDDEN = { hidden: true };
const listbox = () => screen.getByRole('listbox', HIDDEN);
const queryListbox = () => screen.queryByRole('listbox', HIDDEN);

// Accessible-name matching is unavailable for the same reason — the name computation
// returns '' outside the a11y tree — so options are matched on their text.
const option = (label) => {
  const match = within(listbox())
    .getAllByRole('option', HIDDEN)
    .find((el) => el.textContent.includes(label));
  if (!match) throw new Error(`No option matching "${label}"`);
  return match;
};

const openLlmModel = () => {
  renderFlow([makeNode('llm', 'llm-1')]);
  const trigger = screen.getByLabelText('Model');
  fireEvent.click(trigger);
  return trigger;
};

describe('SelectField', () => {
  it('is reachable by its field label', () => {
    renderFlow([makeNode('llm', 'llm-1')]);
    expect(screen.getByLabelText('Model')).toHaveAttribute('role', 'combobox');
  });

  it('shows the current value without opening', () => {
    renderFlow([makeNode('llm', 'llm-1')]);
    expect(screen.getByLabelText('Model')).toHaveTextContent('GPT-4o');
    expect(queryListbox()).not.toBeInTheDocument();
  });

  it('opens on click and lists every option', () => {
    const trigger = openLlmModel();

    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    const options = within(listbox()).getAllByRole('option', HIDDEN);
    expect(options.map((o) => o.textContent.replace(/\s+/g, ''))).toEqual([
      'GPT-4o',
      'ClaudeOpus',
      'Llama3',
    ]);
  });

  it('marks the current option as selected', () => {
    openLlmModel();
    expect(option('GPT-4o')).toHaveAttribute('aria-selected', 'true');
  });

  it('writes the chosen value to node.data and closes', () => {
    openLlmModel();
    fireEvent.click(option('Claude Opus'));

    expect(useStore.getState().nodes[0].data.model).toBe('claude-opus');
    expect(queryListbox()).not.toBeInTheDocument();
  });

  it('opens with the arrow keys without committing anything', () => {
    renderFlow([makeNode('llm', 'llm-1')]);
    const trigger = screen.getByLabelText('Model');

    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(useStore.getState().nodes[0].data.model).toBe('gpt-4o');
  });

  it('moves the highlight only — Enter is what commits', () => {
    renderFlow([makeNode('llm', 'llm-1')]);
    const trigger = screen.getByLabelText('Model');

    fireEvent.keyDown(trigger, { key: 'ArrowDown' }); // open
    fireEvent.keyDown(trigger, { key: 'ArrowDown' }); // highlight "Claude Opus"

    // Still the original value, and the check still sits on the original option.
    expect(useStore.getState().nodes[0].data.model).toBe('gpt-4o');
    expect(option('GPT-4o')).toHaveAttribute('aria-selected', 'true');
    expect(trigger).toHaveAttribute('aria-activedescendant', expect.stringMatching(/-opt-1$/));

    fireEvent.keyDown(trigger, { key: 'Enter' });
    expect(useStore.getState().nodes[0].data.model).toBe('claude-opus');
    expect(queryListbox()).not.toBeInTheDocument();
  });

  it('does not let its keys reach React Flow and select the node', () => {
    renderFlow([makeNode('llm', 'llm-1')]);
    const trigger = screen.getByLabelText('Model');

    for (const key of ['ArrowDown', 'ArrowDown', 'Enter']) {
      fireEvent.keyDown(trigger, { key, bubbles: true });
    }

    expect(useStore.getState().nodes[0].data.model).toBe('claude-opus');
    expect(useStore.getState().nodes[0].selected).not.toBe(true);
  });

  it('discards the highlight on Escape', () => {
    renderFlow([makeNode('llm', 'llm-1')]);
    const trigger = screen.getByLabelText('Model');

    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    fireEvent.keyDown(trigger, { key: 'Escape' });

    expect(queryListbox()).not.toBeInTheDocument();
    expect(useStore.getState().nodes[0].data.model).toBe('gpt-4o');
  });

  it('wraps around and supports Home/End', () => {
    renderFlow([makeNode('llm', 'llm-1')]);
    const trigger = screen.getByLabelText('Model');

    fireEvent.keyDown(trigger, { key: 'ArrowDown' }); // open at index 0
    fireEvent.keyDown(trigger, { key: 'ArrowUp' }); // wrap to last
    expect(trigger).toHaveAttribute('aria-activedescendant', expect.stringMatching(/-opt-2$/));

    fireEvent.keyDown(trigger, { key: 'Home' });
    expect(trigger).toHaveAttribute('aria-activedescendant', expect.stringMatching(/-opt-0$/));

    fireEvent.keyDown(trigger, { key: 'End' });
    fireEvent.keyDown(trigger, { key: 'Enter' });
    expect(useStore.getState().nodes[0].data.model).toBe('llama-3');
  });

  it('closes when clicking outside, without committing', () => {
    openLlmModel();
    fireEvent.keyDown(screen.getByLabelText('Model'), { key: 'ArrowDown' });
    fireEvent.mouseDown(document.body);

    expect(queryListbox()).not.toBeInTheDocument();
    expect(useStore.getState().nodes[0].data.model).toBe('gpt-4o');
  });

  it('closes on a canvas press that stops propagation, as d3-zoom does', () => {
    const { container } = renderFlow([makeNode('llm', 'llm-1')]);
    fireEvent.click(screen.getByLabelText('Model'));
    expect(queryListbox()).toBeInTheDocument();

    // A bubble-phase listener would never see this; the capture-phase one does.
    const pane = screen.getByLabelText('Model').ownerDocument.body;
    pane.addEventListener('mousedown', (e) => e.stopImmediatePropagation());
    fireEvent.mouseDown(container);

    expect(queryListbox()).not.toBeInTheDocument();
  });

  it('stays open when clicking inside the list', () => {
    openLlmModel();
    fireEvent.mouseDown(listbox());
    expect(queryListbox()).toBeInTheDocument();
  });

  it('drives a field that changes the node topology', () => {
    const { container } = renderFlow([makeNode('database', 'database-1')]);
    expect(handleIds(container)).toEqual(['database-1-query', 'database-1-rows']);

    fireEvent.click(screen.getByLabelText('Mode'));
    fireEvent.click(option('Write'));

    expect(useStore.getState().nodes[0].data.mode).toBe('write');
    expect(handleIds(container)).toEqual([
      'database-1-query',
      'database-1-records',
      'database-1-written',
    ]);
  });
});
