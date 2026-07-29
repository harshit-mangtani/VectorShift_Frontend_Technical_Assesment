import { fireEvent, screen } from '@testing-library/react';
import { useStore } from '../../store';
import { renderFlow, makeNode, resetStore, handleIds } from '../../testUtils';

afterEach(resetStore);

const render = (type, data) => renderFlow([makeNode(type, `${type}-1`, data)]);
const dataOf = (id) => useStore.getState().nodes.find((n) => n.id === id).data;

describe('field metadata', () => {
  it('marks required without disturbing the accessible name', () => {
    render('apiRequest');
    expect(screen.getByLabelText('URL')).toHaveAttribute('aria-required', 'true');
  });

  it('flags a blank required field, ahead of any custom rule', () => {
    render('apiRequest', { url: '' });
    expect(screen.getByText('Required')).toBeInTheDocument();
    expect(screen.queryByText(/enter a full url/i)).not.toBeInTheDocument();
  });

  it('wires help to the control, and hides the visible copy from AT', () => {
    render('llm');
    const describedBy = screen.getByLabelText('Model').getAttribute('aria-describedby');
    const copies = screen.getAllByText(/larger models reason better/i);

    expect(copies.find((el) => el.id === describedBy)).toBeDefined();
    expect(copies.find((el) => el.id !== describedBy)).toHaveAttribute(
      'aria-hidden',
      'true'
    );
  });

  it('badges what each control accepts, but not yes/no ones', () => {
    render('apiRequest');
    expect(screen.getByText('Dropdown')).toBeInTheDocument();
    expect(screen.getByText('Number')).toBeInTheDocument();
    expect(screen.queryByText('Boolean')).not.toBeInTheDocument();
  });
});

describe('controls', () => {
  it('commits a switch immediately', () => {
    render('llm');
    const stream = screen.getByLabelText('Stream response');
    expect(stream).toHaveAttribute('role', 'switch');

    fireEvent.click(stream);
    expect(dataOf('llm-1').stream).toBe(true);
  });

  it('masks a secret and reveals it only when its tickbox is on', () => {
    render('llm');
    expect(screen.queryByLabelText('API key')).not.toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Use personal API key'));
    expect(screen.getByLabelText('API key')).toHaveAttribute('type', 'password');
  });

  it('runs an action against its own node, ports and all', () => {
    const { container } = render('jsonParse', { keys: 'zeta, alpha' });

    fireEvent.click(screen.getByText('Sort fields A–Z'));

    expect(dataOf('jsonParse-1').keys).toBe('alpha, zeta');
    expect(handleIds(container)).toEqual([
      'jsonParse-1-json',
      'jsonParse-1-out-0',
      'jsonParse-1-out-1',
    ]);
  });
});
