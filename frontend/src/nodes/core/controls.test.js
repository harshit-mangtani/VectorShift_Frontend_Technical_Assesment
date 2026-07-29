import { fireEvent, screen } from '@testing-library/react';
import { useStore } from '../../store';
import { renderFlow, makeNode, resetStore, handleIds } from '../../testUtils';

afterEach(resetStore);

const render = (type, data) => renderFlow([makeNode(type, `${type}-1`, data)]);
const dataOf = (id) => useStore.getState().nodes.find((n) => n.id === id).data;

describe('toggle', () => {
  it('is a switch, and reports its state', () => {
    render('llm');
    const stream = screen.getByLabelText('Stream response');

    expect(stream).toHaveAttribute('role', 'switch');
    expect(stream).toHaveAttribute('aria-checked', 'false');
  });

  it('commits immediately — no debounce on a discrete control', () => {
    render('llm');

    fireEvent.click(screen.getByLabelText('Stream response'));

    expect(dataOf('llm-1').stream).toBe(true);
    expect(screen.getByLabelText('Stream response')).toHaveAttribute(
      'aria-checked',
      'true'
    );
  });

  it('names both states when a config gives it two labels', () => {
    render('jsonParse');

    expect(screen.getByText('Object')).toBeInTheDocument();
    expect(screen.getByText('Array')).toBeInTheDocument();
  });
});

describe('secret', () => {
  it('is masked', () => {
    render('webhook');
    expect(screen.getByLabelText('Signing secret')).toHaveAttribute('type', 'password');
  });

  it('appears only once the switch that needs it is on', () => {
    render('webhook', { verify: false });
    expect(screen.queryByLabelText('Signing secret')).not.toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Verify signature'));

    expect(screen.getByLabelText('Signing secret')).toBeInTheDocument();
  });

  it('is revealed by a tickbox on the LLM node', () => {
    render('llm');
    expect(screen.queryByLabelText('API key')).not.toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Use personal API key'));

    expect(screen.getByLabelText('API key')).toHaveAttribute('type', 'password');
  });
});

describe('action', () => {
  const button = (name) => screen.getByText(name);

  it('writes back to several of its own fields at once', () => {
    render('llm', { system: 'wandered off', prompt: 'so did this' });

    fireEvent.click(button('Reset instructions'));

    const data = dataOf('llm-1');
    expect(data.system).toMatch(/helpful assistant/);
    expect(data.prompt).toMatch(/\{\{context\}\}/);
  });

  it('can rewrite the field its node derives ports from', async () => {
    const { container } = render('jsonParse', { keys: 'zeta, alpha' });

    fireEvent.click(button('Sort fields A–Z'));

    expect(dataOf('jsonParse-1').keys).toBe('alpha, zeta');
    // The ports follow, because they were always a function of that field.
    expect(await screen.findByTitle('alpha')).toBeInTheDocument();
    expect(handleIds(container)).toEqual([
      'jsonParse-1-json',
      'jsonParse-1-out-0',
      'jsonParse-1-out-1',
    ]);
  });

  it('seeds no value into node.data', () => {
    render('llm');
    expect(dataOf('llm-1')).not.toHaveProperty('undefined');
  });
});
