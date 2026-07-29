import { screen } from '@testing-library/react';
import { renderFlow, makeNode, resetStore } from '../../testUtils';

afterEach(resetStore);

const render = (type, data) => renderFlow([makeNode(type, `${type}-1`, data)]);

describe('field metadata', () => {
  it('marks a required field without disturbing its accessible name', () => {
    render('apiRequest');

    // The marker and badge live outside the <label>, so this still resolves exactly.
    expect(screen.getByLabelText('URL')).toBeInTheDocument();
    expect(screen.getByLabelText('URL')).toHaveAttribute('aria-required', 'true');
  });

  it('flags a required field that has been emptied', () => {
    render('apiRequest', { url: '' });
    expect(screen.getByText('Required')).toBeInTheDocument();
  });

  it('prefers the required message over a custom rule', () => {
    render('apiRequest', { url: '' });
    expect(screen.queryByText(/enter a full url/i)).not.toBeInTheDocument();
  });

  it('leaves optional fields unmarked', () => {
    render('llm');
    expect(screen.getByLabelText('Model')).not.toHaveAttribute('aria-required');
  });

  it('exposes help text to the control that owns it', () => {
    render('llm');
    const control = screen.getByLabelText('Model');
    const describedBy = control.getAttribute('aria-describedby');

    // The text appears twice — a hover bubble and a screen-reader copy. Only the copy is
    // wired to the control, because a hidden bubble would be unreadable when it matters.
    const copies = screen.getAllByText(/larger models reason better/i);
    expect(copies).toHaveLength(2);
    expect(copies.find((el) => el.id === describedBy)).toBeDefined();
    expect(copies.find((el) => el.id !== describedBy)).toHaveAttribute(
      'aria-hidden',
      'true'
    );
  });

  it('badges each control with what it accepts', () => {
    render('apiRequest');

    expect(screen.getByText('Dropdown')).toBeInTheDocument(); // method
    expect(screen.getByText('Number')).toBeInTheDocument(); // timeout
    expect(screen.getAllByText('Text').length).toBeGreaterThan(0); // url, headers
  });

  it('leaves yes/no controls unbadged — the control already says it', () => {
    render('llm');

    // getByLabelText follows the for/id pair, which works where accessible-name
    // computation does not — a node stays visibility:hidden in jsdom.
    expect(screen.getByLabelText('Use personal API key')).toHaveAttribute(
      'type',
      'checkbox'
    );
    expect(screen.getByLabelText('Stream response')).toHaveAttribute('role', 'switch');
    expect(screen.queryByText('Boolean')).not.toBeInTheDocument();
  });
});
