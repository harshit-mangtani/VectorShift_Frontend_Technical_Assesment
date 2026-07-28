import { fireEvent } from '@testing-library/react';
import { renderFlow, makeNode, resetStore } from '../testUtils';

const mockRemeasure = jest.fn();
jest.mock('reactflow', () => {
  const actual = jest.requireActual('reactflow');
  return {
    __esModule: true,
    ...actual,
    default: actual.default ?? actual.ReactFlow,
    useUpdateNodeInternals: () => mockRemeasure,
  };
});

const ID = 'text-1';

// The card is a styling shell with no role of its own; the selector is the only handle.
// eslint-disable-next-line testing-library/no-node-access
const card = () => document.querySelector(`.react-flow__node[data-id="${ID}"] .rf-card`);

// jsdom's TransitionEvent drops `propertyName`, so the event is built by hand.
const endTransition = (el, propertyName) => {
  const event = new Event('transitionend', { bubbles: true });
  event.propertyName = propertyName;
  fireEvent(el, event);
};

// Mounting measures the node once already; only what happens afterwards is under test.
const mount = () => {
  renderFlow([makeNode('text', ID, { text: '{{a}}' })]);
  mockRemeasure.mockClear();
};

afterEach(() => {
  resetStore();
  mockRemeasure.mockClear();
});

describe('re-measuring ports after a card transform', () => {
  it('re-reads the ports when the entrance animation finishes', () => {
    mount();
    fireEvent.animationEnd(card());
    expect(mockRemeasure).toHaveBeenCalledWith(ID);
  });

  it('re-reads them when a transform transition finishes', () => {
    mount();
    endTransition(card(), 'transform');
    expect(mockRemeasure).toHaveBeenCalledWith(ID);
  });

  it('ignores transitions that cannot move a port', () => {
    mount();
    endTransition(card(), 'box-shadow');
    expect(mockRemeasure).not.toHaveBeenCalled();
  });

  it('will not measure a card that is still transformed', () => {
    mount();
    const real = window.getComputedStyle;
    window.getComputedStyle = () => ({ transform: 'matrix(0.94, 0, 0, 0.94, 0, 0)' });

    endTransition(card(), 'transform');

    window.getComputedStyle = real;
    expect(mockRemeasure).not.toHaveBeenCalled();
  });
});
