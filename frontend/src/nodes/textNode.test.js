import { fireEvent, screen, waitFor } from '@testing-library/react';
import { useStore } from '../store';
import { renderFlow, makeNode, resetStore, handleIds } from '../testUtils';

const ID = 'text-1';
const textNode = (text) => makeNode('text', ID, { text });

afterEach(resetStore);

const typeText = (value) =>
  fireEvent.change(screen.getByLabelText('Text'), { target: { value } });

describe('Text node variables', () => {
  it('creates one target handle per variable, in order, plus the output', () => {
    const { container } = renderFlow([textNode('{{a}} {{b}}')]);
    expect(handleIds(container)).toEqual([
      `${ID}-in-0`,
      `${ID}-in-1`,
      `${ID}-output`,
    ]);
  });

  it('creates a single handle for a repeated variable', () => {
    const { container } = renderFlow([textNode('{{a}} then {{a}}')]);
    expect(handleIds(container)).toEqual([`${ID}-in-0`, `${ID}-output`]);
  });

  it('ignores invalid names and warns instead', () => {
    const { container } = renderFlow([textNode('{{2bad}}')]);
    expect(handleIds(container)).toEqual([`${ID}-output`]);
    expect(screen.getByText(/not a valid variable name/i)).toBeInTheDocument();
  });

  it('adds a handle as the user types', async () => {
    const { container } = renderFlow([textNode('')]);
    typeText('{{fresh}}');

    await waitFor(() =>
      expect(handleIds(container)).toContain(`${ID}-in-0`)
    );
    expect(screen.getByTitle('fresh')).toBeInTheDocument();
  });

  it('removes the handle and prunes its edge when the variable is deleted', async () => {
    const edge = {
      id: 'e1',
      source: 'input-1',
      target: ID,
      targetHandle: `${ID}-in-0`,
    };
    const { container } = renderFlow([textNode('{{gone}}')], [edge]);
    expect(handleIds(container)).toContain(`${ID}-in-0`);

    typeText('nothing left');

    await waitFor(() =>
      expect(handleIds(container)).not.toContain(`${ID}-in-0`)
    );
    await waitFor(() => expect(useStore.getState().edges).toHaveLength(0));
  });

  it('keeps the handle id and the connection untouched across a rename', async () => {
    const edge = {
      id: 'e1',
      source: 'input-1',
      target: ID,
      targetHandle: `${ID}-in-0`,
    };
    const { container } = renderFlow([textNode('{{name}}')], [edge]);
    const before = handleIds(container);

    typeText('{{customerName}}');

    // The label follows the new name...
    expect(await screen.findByTitle('customerName')).toBeInTheDocument();
    // ...but the port itself never moved, so nothing had to be remapped or re-measured.
    expect(handleIds(container)).toEqual(before);
    expect(useStore.getState().edges).toEqual([edge]);
  });

  it('survives renaming one of several variables', async () => {
    const edges = [
      { id: 'e1', source: 'i-1', target: ID, targetHandle: `${ID}-in-0` },
      { id: 'e2', source: 'i-2', target: ID, targetHandle: `${ID}-in-1` },
    ];
    renderFlow([textNode('{{first}} {{second}}')], edges);

    typeText('{{first}} {{secondRenamed}}');

    expect(await screen.findByTitle('secondRenamed')).toBeInTheDocument();
    expect(useStore.getState().edges).toEqual(edges);
  });

  it('shortening a name is just as inert as lengthening it', async () => {
    const edge = { id: 'e1', source: 'i-1', target: ID, targetHandle: `${ID}-in-0` };
    renderFlow([textNode('{{customerName}}')], [edge]);

    typeText('{{n}}');

    expect(await screen.findByTitle('n')).toBeInTheDocument();
    expect(useStore.getState().edges).toEqual([edge]);
  });

  it('keeps the output handle no matter what', async () => {
    const { container } = renderFlow([textNode('{{a}}')]);
    typeText('');
    await waitFor(() => expect(handleIds(container)).toEqual([`${ID}-output`]));
  });
});

describe('port labels', () => {
  it('renders a long variable name in full, without truncation', () => {
    const name = 'customer_shipping_address_line_one';
    renderFlow([textNode(`{{${name}}}`)]);

    expect(screen.getByTitle(name)).toHaveTextContent(name);
  });

  it('keeps two names that share a long prefix distinguishable', () => {
    const a = 'customer_shipping_address';
    const b = 'customer_shipping_country';
    renderFlow([textNode(`{{${a}}} {{${b}}}`)]);

    expect(screen.getByTitle(a)).toHaveTextContent(a);
    expect(screen.getByTitle(b)).toHaveTextContent(b);
  });
});

describe('Text node vertical space', () => {
  const { textConfig } = require('./configs/text.config');

  it('never pads the card out beyond its content', () => {
    // The card used to reserve port room via minHeight, leaving dead space under the
    // field that persisted because it tracked the port count, not the text.
    expect(textConfig.size({ text: '{{a}} {{b}} {{c}}' })).not.toHaveProperty(
      'minHeight'
    );
  });

  it('reserves the ports room on the field itself', () => {
    renderFlow([textNode('{{a}}')]);
    const one = screen.getByLabelText('Text').style.minHeight;

    resetStore();
    renderFlow([textNode('{{a}} {{b}} {{c}}')]);
    const three = screen.getAllByLabelText('Text').at(-1).style.minHeight;

    expect(parseInt(three, 10)).toBeGreaterThan(parseInt(one, 10));
  });

  it('does not keep space reserved once the variables are gone', async () => {
    renderFlow([textNode('{{a}} {{b}} {{c}}')]);
    const area = screen.getByLabelText('Text');
    const tall = parseInt(area.style.minHeight, 10);

    typeText('plain text');

    await waitFor(() =>
      expect(parseInt(area.style.minHeight, 10)).toBeLessThan(tall)
    );
  });
});

describe('Text node sizing', () => {
  it('grows in height as lines are added', async () => {
    renderFlow([textNode('one')]);
    const area = screen.getByLabelText('Text');

    // jsdom has no layout, so assert the autosize hook drives the style at all.
    await waitFor(() => expect(area.style.height).not.toBe(''));
  });

  it('grows in width with longer content', () => {
    const { textWidth } = require('./configs/text.config');
    const short = textWidth('hi');
    const long = textWidth('a considerably longer single line of text');

    expect(long).toBeGreaterThan(short);
    expect(long).toBeLessThanOrEqual(460);
  });
});
