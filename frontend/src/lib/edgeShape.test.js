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

describe('edge shape', () => {
  it('routes through the trimmed edge when straight', () => {
    expect(shapeEdges(edges, 'straight').map((e) => e.type)).toEqual([
      'trimmed',
      'trimmed',
    ]);
  });

  it('routes through the bezier edge when curved', () => {
    expect(shapeEdges(edges, 'curved').map((e) => e.type)).toEqual([
      'curved',
      'curved',
    ]);
  });

  it('re-routes connections that are already on the canvas', () => {
    const straight = shapeEdges(edges, 'straight');
    expect(shapeEdges(straight, 'curved').map((e) => e.type)).toEqual([
      'curved',
      'curved',
    ]);
  });

  it('leaves an already-correct edge untouched, so nothing re-renders', () => {
    const once = shapeEdges(edges, 'straight');
    const twice = shapeEdges(once, 'straight');

    expect(twice[0]).toBe(once[0]);
    expect(twice[1]).toBe(once[1]);
  });

  it('starts straight and flips on each toggle', () => {
    expect(useStore.getState().edgeShape).toBe('straight');
    useStore.getState().toggleEdgeShape();
    expect(useStore.getState().edgeShape).toBe('curved');
    useStore.getState().toggleEdgeShape();
    expect(useStore.getState().edgeShape).toBe('straight');
  });
});

describe('edge shape toggle', () => {
  const renderToggle = (shape, onToggle = () => {}) =>
    render(<EdgeShapeToggle shape={shape} onToggle={onToggle} />);

  it('names the shape in use', () => {
    const { rerender } = renderToggle('straight');
    expect(screen.getByRole('button')).toHaveAccessibleName('Straight Connections');

    rerender(<EdgeShapeToggle shape="curved" onToggle={() => {}} />);
    expect(screen.getByRole('button')).toHaveAccessibleName('Curved Connections');
  });

  it('asks for the other shape when pressed', () => {
    const onToggle = jest.fn();
    renderToggle('straight', onToggle);

    fireEvent.click(screen.getByRole('button', { name: /straight connections/i }));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});
