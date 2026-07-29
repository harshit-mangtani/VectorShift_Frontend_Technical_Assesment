import { fireEvent, render, screen } from '@testing-library/react';
import { EdgeShapeToggle } from '../components/EdgeShapeToggle';
import { useStore } from '../store';
import { resetStore } from '../testUtils';
import { shapeEdges } from './edgeShape';

const edges = [
  { id: 'e1', source: 'a', target: 'b' },
  { id: 'e2', source: 'b', target: 'c' },
];

afterEach(resetStore);

it('stamps the shape on at render, so the toggle re-routes existing connections', () => {
  const straight = shapeEdges(edges, 'straight');
  expect(straight.map((e) => e.type)).toEqual(['trimmed', 'trimmed']);
  expect(shapeEdges(straight, 'curved').map((e) => e.type)).toEqual(['curved', 'curved']);
});

it('passes an already-correct edge through by identity, so nothing re-renders', () => {
  const once = shapeEdges(edges, 'straight');
  const twice = shapeEdges(once, 'straight');
  expect(twice[0]).toBe(once[0]);
});

it('starts straight and flips on each toggle', () => {
  expect(useStore.getState().edgeShape).toBe('straight');
  useStore.getState().toggleEdgeShape();
  expect(useStore.getState().edgeShape).toBe('curved');
  useStore.getState().toggleEdgeShape();
  expect(useStore.getState().edgeShape).toBe('straight');
});

it('names the shape in use, and asks for the other when pressed', () => {
  const onToggle = jest.fn();
  const { rerender } = render(
    <EdgeShapeToggle shape="straight" onToggle={onToggle} />
  );
  expect(screen.getByRole('button')).toHaveAccessibleName('Straight Connections');

  fireEvent.click(screen.getByRole('button'));
  expect(onToggle).toHaveBeenCalledTimes(1);

  rerender(<EdgeShapeToggle shape="curved" onToggle={onToggle} />);
  expect(screen.getByRole('button')).toHaveAccessibleName('Curved Connections');
});
