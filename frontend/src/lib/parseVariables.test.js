import { parseVariables } from './parseVariables';

const vars = (text) => parseVariables(text).variables;

describe('parseVariables', () => {
  it('accepts the identifier forms the brief calls out, padding and all', () => {
    expect(vars('{{input}} {{ spaced }} {{_private}} {{$x}} {{a1_B}}')).toEqual([
      'input',
      'spaced',
      '_private',
      '$x',
      'a1_B',
    ]);
  });

  it('rejects anything that is not a valid identifier', () => {
    expect(vars('{{two words}} {{kebab-case}} {{2bad}} {{}} {{unterminated')).toEqual([]);
  });

  it('rejects reserved words', () => {
    expect(vars('{{class}} {{return}} {{null}}')).toEqual([]);
  });

  it('dedupes while preserving first appearance order', () => {
    expect(vars('{{b}} {{a}} {{b}}')).toEqual(['b', 'a']);
  });

  it('reports invalid names separately so the UI can warn', () => {
    expect(parseVariables('{{ok}} {{2bad}}')).toEqual({
      variables: ['ok'],
      invalid: ['2bad'],
    });
  });

  it('treats missing text as empty', () => {
    expect(parseVariables()).toEqual({ variables: [], invalid: [] });
  });
});
