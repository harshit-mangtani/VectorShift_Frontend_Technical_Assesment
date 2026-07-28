import { Wand2 } from 'lucide-react';
import { parseVariables } from '../../lib/parseVariables';

// Demonstrates: the Text node's {{variable}} ports reused by a different node in three lines.
export const transformConfig = {
  type: 'transform',
  label: 'Transform',
  description: 'Build a value from a template',
  icon: Wand2,
  category: 'utility',
  fields: [
    {
      key: 'template',
      type: 'textarea',
      label: 'Template',
      defaultValue: 'Hello {{name}}',
      rows: 2,
    },
    {
      key: 'trim',
      type: 'checkbox',
      label: 'Trim whitespace',
      defaultValue: true,
    },
  ],
  // Positional slot ids, with the variable name carried as the label only — see the
  // note in text.config.js for why the two are kept apart.
  handles: (data) => [
    ...parseVariables(data.template).variables.map((name, index) => ({
      type: 'target',
      id: `in-${index}`,
      label: name,
    })),
    { type: 'source', id: 'result' },
  ],
};
