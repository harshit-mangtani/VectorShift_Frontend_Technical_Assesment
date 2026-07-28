import { parseVariables } from './parseVariables';

const vars = (text) => parseVariables(text).variables;

describe('parseVariables', () => {
  it('accepts the identifier forms the brief calls out', () => {
    expect(vars('{{input}} {{name}} {{user_name}} {{value2}} {{$value}}')).toEqual([
      'input',
      'name',
      'user_name',
      'value2',
      '$value',
    ]);
  });

  it('trims padding inside the braces', () => {
    expect(vars('{{ input }}')).toEqual(['input']);
  });

  it('rejects names containing whitespace', () => {
    expect(vars('{{user name}}')).toEqual([]);
  });

  it('rejects hyphenated and digit-leading names', () => {
    expect(vars('{{user-name}} {{2value}}')).toEqual([]);
  });

  it('rejects reserved words', () => {
    expect(vars('{{class}} {{if}} {{true}} {{null}}')).toEqual([]);
  });

  it('ignores empty and unterminated expressions', () => {
    expect(vars('{{}} {{oops')).toEqual([]);
  });

  it('dedupes while preserving first appearance order', () => {
    expect(vars('{{b}} {{a}} {{b}}')).toEqual(['b', 'a']);
  });

  it('handles adjacent expressions', () => {
    expect(vars('{{a}}{{b}}')).toEqual(['a', 'b']);
  });

  it('reports invalid names separately so the UI can warn', () => {
    expect(parseVariables('{{2bad}} {{good}}')).toEqual({
      variables: ['good'],
      invalid: ['2bad'],
    });
  });

  it('treats missing text as empty', () => {
    expect(parseVariables()).toEqual({ variables: [], invalid: [] });
  });
});
