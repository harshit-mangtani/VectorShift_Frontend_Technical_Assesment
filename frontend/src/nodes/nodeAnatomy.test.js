import { fireEvent, screen, waitFor } from '@testing-library/react';
import { renderFlow, makeNode, resetStore, handleIds } from '../testUtils';

afterEach(resetStore);

const render = (type, data) => renderFlow([makeNode(type, `${type}-1`, data)]);

// React Flow keeps a node hidden until it has measured it, and jsdom never will — so an
// accessible name inside a node always computes to "". Text is the only usable handle.
const disclosure = () => screen.getByText(/advanced outputs/i);

describe('node identifier', () => {
  it('shows the id a {{reference}} would resolve against', () => {
    render('llm');
    expect(screen.getByTitle('llm-1')).toHaveTextContent('llm-1');
  });

  it('is omitted by a node that opts out of the header', () => {
    render('note');
    expect(screen.queryByTitle('note-1')).not.toBeInTheDocument();
  });
});

describe('outputs panel', () => {
  it('states what the node emits', () => {
    render('webhook');

    expect(screen.getByText('Outputs')).toBeInTheDocument();
    expect(screen.getByText('payload')).toBeInTheDocument();
    expect(screen.getByText('Parsed request body')).toBeInTheDocument();
    expect(screen.getByText('JSON')).toBeInTheDocument();
  });

  it('keeps rarely-read fields behind a disclosure', async () => {
    render('webhook');
    expect(screen.queryByText('received_at')).not.toBeInTheDocument();

    expect(disclosure()).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(disclosure());

    expect(await screen.findByText('received_at')).toBeInTheDocument();
    expect(screen.getByText('headers')).toBeInTheDocument();
    expect(disclosure()).toHaveAttribute('aria-expanded', 'true');
  });

  it('offers no disclosure when there is nothing behind it', () => {
    render('text');
    expect(screen.getByText('output')).toBeInTheDocument();
    expect(screen.queryByText(/advanced outputs/i)).not.toBeInTheDocument();
  });

  it('is absent from a node that declares none', () => {
    render('customOutput');
    expect(screen.queryByText('Outputs')).not.toBeInTheDocument();
  });

  it('tracks data when a config derives its outputs', () => {
    render('jsonParse', { keys: 'alpha' });

    expect(screen.getByText('Value at alpha')).toBeInTheDocument();
    expect(screen.queryByText('Value at id')).not.toBeInTheDocument();
  });
});

describe('Webhook — a node with no inputs', () => {
  it('declares source ports only', () => {
    const { container } = render('webhook');
    expect(handleIds(container)).toEqual(['webhook-1-payload']);
  });
});

describe('JSON Parse — ports and outputs from one field', () => {
  it('derives both from the declared keys', () => {
    const { container } = render('jsonParse');

    expect(handleIds(container)).toEqual([
      'jsonParse-1-json',
      'jsonParse-1-out-0',
      'jsonParse-1-out-1',
    ]);
    expect(screen.getByTitle('id')).toBeInTheDocument();
    expect(screen.getByTitle('name')).toBeInTheDocument();
  });

  it('grows both when a key is added', async () => {
    const { container } = render('jsonParse');

    fireEvent.change(screen.getByLabelText('Fields'), {
      target: { value: 'id, name, email' },
    });

    await waitFor(() =>
      expect(handleIds(container)).toContain('jsonParse-1-out-2')
    );
    expect(screen.getByText('Value at email')).toBeInTheDocument();
  });

  it('ignores blanks and repeats', () => {
    const { container } = render('jsonParse', { keys: 'id, , id, name,' });
    expect(handleIds(container)).toEqual([
      'jsonParse-1-json',
      'jsonParse-1-out-0',
      'jsonParse-1-out-1',
    ]);
  });
});
