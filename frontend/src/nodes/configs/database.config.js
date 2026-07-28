import { Database } from 'lucide-react';

// Demonstrates: a field that changes the node's own topology — write mode adds a port.
export const databaseConfig = {
  type: 'database',
  label: 'Database',
  description: 'Read from or write to a table',
  icon: Database,
  category: 'data',
  fields: [
    {
      key: 'mode',
      type: 'select',
      label: 'Mode',
      defaultValue: 'read',
      options: [
        { label: 'Read', value: 'read' },
        { label: 'Write', value: 'write' },
      ],
    },
    { key: 'table', type: 'text', label: 'Table', defaultValue: 'documents' },
    {
      key: 'limit',
      type: 'number',
      label: 'Row limit',
      defaultValue: 100,
      numeric: { min: 1, max: 10000, step: 1 },
      visibleIf: (data) => data.mode === 'read',
    },
  ],
  handles: (data) =>
    data.mode === 'write'
      ? [
          { type: 'target', id: 'query', label: 'query' },
          { type: 'target', id: 'records', label: 'records' },
          { type: 'source', id: 'written', label: 'written' },
        ]
      : [
          { type: 'target', id: 'query', label: 'query' },
          { type: 'source', id: 'rows', label: 'rows' },
        ],
};
