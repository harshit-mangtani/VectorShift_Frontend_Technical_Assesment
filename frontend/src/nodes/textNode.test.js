import { fireEvent, screen, waitFor } from '@testing-library/react';
import { useStore } from '../store';
import { renderFlow, makeNode, resetStore, handleIds } from '../testUtils';

const ID = 'text-1';
const textNode = (text) => makeNode('text', ID, { text });

afterEach(resetStore);

const typeText = (value) =>
  fireEvent.change(screen.getByLabelText('Text'), { target: { value } });

describe('variables become ports', () => {
  it('one per variable, in order, deduped, plus the output', () => {
    const { container } = renderFlow([textNode('{{a}} {{b}} then {{a}}')]);
    expect(handleIds(container)).toEqual([
      `${ID}-in-0`,
      `${ID}-in-1`,
      `${ID}-output`,
    ]);
  });

  it('ignores invalid names and warns instead', () => {
    const { container } = renderFlow([textNode('{{2bad}}')]);
    expect(handleIds(container)).toEqual([`${ID}-output`]);
    expect(screen.getByText(/not a valid variable name/i)).toBeInTheDocument();
  });

  it('adds a port as the user types', async () => {
    const { container } = renderFlow([textNode('')]);
    typeText('{{fresh}}');

    await waitFor(() => expect(handleIds(container)).toContain(`${ID}-in-0`));
    expect(screen.getByTitle('fresh')).toBeInTheDocument();
  });

  it('removes the port and prunes its edge when the variable goes', async () => {
    const edge = { id: 'e1', source: 'i-1', target: ID, targetHandle: `${ID}-in-0` };
    const { container } = renderFlow([textNode('{{gone}}')], [edge]);

    typeText('nothing left');

    await waitFor(() => expect(handleIds(container)).not.toContain(`${ID}-in-0`));
    await waitFor(() => expect(useStore.getState().edges).toHaveLength(0));
  });

  it('leaves ids and connections untouched across a rename', async () => {
    const edges = [
      { id: 'e1', source: 'i-1', target: ID, targetHandle: `${ID}-in-0` },
      { id: 'e2', source: 'i-2', target: ID, targetHandle: `${ID}-in-1` },
    ];
    const { container } = renderFlow([textNode('{{first}} {{second}}')], edges);
    const before = handleIds(container);

    typeText('{{first}} {{n}}');

    // The label follows the new name; the port never moved, so nothing was remapped.
    expect(await screen.findByTitle('n')).toBeInTheDocument();
    expect(handleIds(container)).toEqual(before);
    expect(useStore.getState().edges).toEqual(edges);
  });
});

describe('the field grows with its content', () => {
  it('in height', async () => {
    renderFlow([textNode('one')]);
    const area = screen.getByLabelText('Text');

    // jsdom has no layout, so assert the autosize hook drives the style at all.
    await waitFor(() => expect(area.style.height).not.toBe(''));
  });

  it('in width, up to a bound', () => {
    const { textWidth } = require('./configs/text.config');

    expect(textWidth('a considerably longer single line of text')).toBeGreaterThan(
      textWidth('hi')
    );
    expect(textWidth('x'.repeat(500))).toBeLessThanOrEqual(460);
  });

  it('reserves the ports their room on the field, not the card', () => {
    const { textConfig } = require('./configs/text.config');
    expect(textConfig.size({ text: '{{a}} {{b}} {{c}}' })).not.toHaveProperty('minHeight');

    renderFlow([textNode('{{a}}')]);
    const one = parseInt(screen.getByLabelText('Text').style.minHeight, 10);

    resetStore();
    renderFlow([textNode('{{a}} {{b}} {{c}}')]);
    const three = parseInt(
      screen.getAllByLabelText('Text').at(-1).style.minHeight,
      10
    );

    expect(three).toBeGreaterThan(one);
  });
});
