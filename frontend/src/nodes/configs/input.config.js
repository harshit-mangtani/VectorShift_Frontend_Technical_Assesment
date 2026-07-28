import { LogIn } from 'lucide-react';

export const inputConfig = {
  type: 'customInput',
  label: 'Input',
  description: 'Pipeline entry point',
  icon: LogIn,
  category: 'io',
  fields: [
    {
      key: 'inputName',
      type: 'text',
      label: 'Name',
      defaultValue: (id) => id.replace('customInput-', 'input_'),
    },
    {
      key: 'inputType',
      type: 'select',
      label: 'Type',
      defaultValue: 'Text',
      options: [
        { label: 'Text', value: 'Text' },
        { label: 'File', value: 'File' },
      ],
    },
  ],
  handles: [{ type: 'source', id: 'value' }],
};
