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
// eslint-disable-next-line testing-library/no-node-access
const card = () => document.querySelector(`.react-flow__node[data-id="${ID}"] .rf-card`);

const mount = () => {
  renderFlow([makeNode('text', ID, { text: '{{a}}' })]);
  mockRemeasure.mockClear();
};

afterEach(() => {
  resetStore();
  mockRemeasure.mockClear();
});

it('re-reads the ports once the entrance animation finishes', () => {
  mount();
  fireEvent.animationEnd(card());
  expect(mockRemeasure).toHaveBeenCalledWith(ID);
});

it('will not measure a card that is still transformed', () => {
  mount();
  const real = window.getComputedStyle;
  window.getComputedStyle = () => ({ transform: 'matrix(0.94, 0, 0, 0.94, 0, 0)' });

  fireEvent.animationEnd(card());

  window.getComputedStyle = real;
  expect(mockRemeasure).not.toHaveBeenCalled();
});
