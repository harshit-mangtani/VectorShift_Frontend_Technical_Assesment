import { fireEvent, screen, waitFor } from '@testing-library/react';
import { renderFlow, makeNode, resetStore, handleIds } from '../testUtils';

afterEach(resetStore);

const render = (type, data) => renderFlow([makeNode(type, `${type}-1`, data)]);

describe('card anatomy', () => {
  it('shows the id a {{reference}} resolves against, unless the node opts out', () => {
    render('llm');
    expect(screen.getByTitle('llm-1')).toHaveTextContent('llm-1');

    resetStore();
    render('note');
    expect(screen.queryByTitle('note-1')).not.toBeInTheDocument();
  });

  it('states what the node emits, keeping advanced fields behind a disclosure', async () => {
    render('webhook');
    expect(screen.getByText('payload')).toBeInTheDocument();
    expect(screen.getByText('Parsed request body')).toBeInTheDocument();
    expect(screen.queryByText('received_at')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText(/advanced outputs/i));
    expect(await screen.findByText('received_at')).toBeInTheDocument();
  });

  it('has no outputs panel when a config declares none', () => {
    render('customOutput');
    expect(screen.queryByText('Outputs')).not.toBeInTheDocument();
  });
});

describe('nodes the abstraction had to stretch for', () => {
  it('Webhook declares source ports only', () => {
    const { container } = render('webhook');
    expect(handleIds(container)).toEqual(['webhook-1-payload']);
  });

  it('JSON Parse derives ports and outputs from one field, and grows with it', async () => {
    const { container } = render('jsonParse');
    expect(handleIds(container)).toEqual([
      'jsonParse-1-json',
      'jsonParse-1-out-0',
      'jsonParse-1-out-1',
    ]);

    fireEvent.change(screen.getByLabelText('Fields'), {
      target: { value: 'id, name, email' },
    });

    await waitFor(() => expect(handleIds(container)).toContain('jsonParse-1-out-2'));
    expect(screen.getByText('Value at email')).toBeInTheDocument();
  });

  it('JSON Parse ignores blanks and repeats', () => {
    const { container } = render('jsonParse', { keys: 'id, , id, name,' });
    expect(handleIds(container)).toEqual([
      'jsonParse-1-json',
      'jsonParse-1-out-0',
      'jsonParse-1-out-1',
    ]);
  });
});
