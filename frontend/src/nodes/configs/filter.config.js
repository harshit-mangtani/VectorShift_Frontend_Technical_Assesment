import { Filter } from 'lucide-react';

const UNARY = ['is_empty', 'is_not_empty'];

export const filterConfig = {
  type: 'filter',
  label: 'Filter',
  description: 'Route records by a condition',
  icon: Filter,
  category: 'logic',
  fields: [
    {
      key: 'operator',
      type: 'select',
      label: 'Condition',
      help: 'Unary operators hide the value field — there is nothing to compare against.',
      defaultValue: 'equals',
      options: [
        { label: 'equals', value: 'equals' },
        { label: 'contains', value: 'contains' },
        { label: 'is empty', value: 'is_empty' },
        { label: 'is not empty', value: 'is_not_empty' },
      ],
    },
    {
      key: 'value',
      type: 'text',
      label: 'Value',
      help: 'Compared against each incoming record. Hidden for unary operators.',
      defaultValue: '',
      visibleIf: (data) => !UNARY.includes(data.operator),
    },
    {
      key: 'caseSensitive',
      type: 'toggle',
      label: 'Case sensitive',
      help: 'Off, "Ada" and "ada" are treated as the same value.',
      defaultValue: false,
    },
  ],
  handles: [
    { type: 'target', id: 'input' },
    { type: 'source', id: 'pass', label: 'pass' },
    { type: 'source', id: 'fail', label: 'fail' },
  ],
  outputs: [
    { key: 'pass', type: 'List<Any>', description: 'Records matching the condition' },
    { key: 'fail', type: 'List<Any>', description: 'Everything else' },
  ],
};
