import '@testing-library/jest-dom';

// React Flow measures the DOM on mount; jsdom reports zero for everything, so these
// stubs are what make any canvas render testable at all.
global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

global.DOMMatrixReadOnly = class {
  constructor(transform) {
    const [a, b, c, d, e, f] = transform
      ?.match(/^matrix\((.+)\)$/)?.[1]
      ?.split(', ')
      ?.map(Number) ?? [1, 0, 0, 1, 0, 0];
    Object.assign(this, { m22: d, a, b, c, d, e, f });
  }
};

Object.defineProperties(global.HTMLElement.prototype, {
  offsetHeight: { get: () => 40 },
  offsetWidth: { get: () => 232 },
});

global.SVGElement.prototype.getBBox = () => ({ x: 0, y: 0, width: 0, height: 0 });

// Canvas is unavailable in jsdom; measureText falls back to a character estimate.
global.HTMLCanvasElement.prototype.getContext = () => null;
