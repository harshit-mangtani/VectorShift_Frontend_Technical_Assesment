import { ArrowDownAZ, Braces } from 'lucide-react';

const keysOf = (value) =>
  (value ?? '')
    .split(',')
    .map((key) => key.trim())
    .filter(Boolean)
    .filter((key, index, all) => all.indexOf(key) === index);

// Demonstrates: `outputs` driven by data, the same way `handles` already is — and on the
// source side, so the ports the user wires *out of* are the ones they declared.
export const jsonParseConfig = {
  type: 'jsonParse',
  label: 'JSON Parse',
  description: 'Split a JSON payload into fields',
  icon: Braces,
  category: 'data',
  fields: [
    {
      key: 'keys',
      type: 'text',
      label: 'Fields',
      required: true,
      help: 'Comma-separated top-level keys to expose as ports.',
      defaultValue: 'id, name',
    },
    {
      key: 'shape',
      type: 'toggle',
      label: 'Payload shape',
      help: 'Array mode maps every element through the same field list.',
      labels: ['Object', 'Array'],
      defaultValue: false,
    },
    {
      key: 'strict',
      type: 'toggle',
      label: 'Fail on missing key',
      help: 'Off, a missing key yields null instead of stopping the pipeline.',
      defaultValue: false,
    },
    {
      type: 'action',
      label: 'Sort fields A–Z',
      help: 'Reorders the field list alphabetically; the ports follow it.',
      icon: ArrowDownAZ,
      run: (data, set) =>
        set(
          'keys',
          keysOf(data.keys)
            .sort((a, b) => a.localeCompare(b))
            .join(', ')
        ),
    },
  ],
  handles: (data) => [
    { type: 'target', id: 'json' },
    // Positional ids, name carried as the label — see the note in text.config.js.
    ...keysOf(data.keys).map((key, index) => ({
      type: 'source',
      id: `out-${index}`,
      label: key,
    })),
  ],
  outputs: (data) =>
    keysOf(data.keys).map((key) => ({
      key,
      type: 'Any',
      description: `Value at ${key}`,
    })),
};
