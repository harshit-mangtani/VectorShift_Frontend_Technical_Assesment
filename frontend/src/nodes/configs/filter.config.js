import { Filter } from 'lucide-react';

const UNARY = ['is_empty', 'is_not_empty'];

// Demonstrates: two source handles, plus a field that appears only for binary operators.
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
      defaultValue: '',
      visibleIf: (data) => !UNARY.includes(data.operator),
    },
    {
      key: 'caseSensitive',
      type: 'checkbox',
      label: 'Case sensitive',
      defaultValue: false,
    },
  ],
  handles: [
    { type: 'target', id: 'input' },
    { type: 'source', id: 'pass', label: 'pass' },
    { type: 'source', id: 'fail', label: 'fail' },
  ],
};
