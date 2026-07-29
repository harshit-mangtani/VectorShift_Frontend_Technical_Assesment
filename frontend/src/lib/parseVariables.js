const VARIABLE = /\{\{\s*([^{}]*?)\s*\}\}/g;
const IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

const RESERVED = new Set([
  'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger', 'default',
  'delete', 'do', 'else', 'enum', 'export', 'extends', 'false', 'finally',
  'for', 'function', 'if', 'import', 'in', 'instanceof', 'new', 'null',
  'return', 'super', 'switch', 'this', 'throw', 'true', 'try', 'typeof',
  'var', 'void', 'while', 'with', 'yield',
]);

const isValid = (name) => IDENTIFIER.test(name) && !RESERVED.has(name);

const cache = new Map();
const CACHE_LIMIT = 50;

export const parseVariables = (text = '') => {
  if (cache.has(text)) return cache.get(text);

  const variables = [];
  const invalid = [];
  for (const [, name] of text.matchAll(VARIABLE)) {
    const bucket = isValid(name) ? variables : invalid;
    if (name && !bucket.includes(name)) bucket.push(name);
  }

  const result = { variables, invalid };
  if (cache.size >= CACHE_LIMIT) cache.clear();
  cache.set(text, result);
  return result;
};
