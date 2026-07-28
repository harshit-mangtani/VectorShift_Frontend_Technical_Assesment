import { LogOut } from 'lucide-react';

export const outputConfig = {
  type: 'customOutput',
  label: 'Output',
  description: 'Pipeline result',
  icon: LogOut,
  category: 'io',
  fields: [
    {
      key: 'outputName',
      type: 'text',
      label: 'Name',
      defaultValue: (id) => id.replace('customOutput-', 'output_'),
    },
    {
      key: 'outputType',
      type: 'select',
      label: 'Type',
      defaultValue: 'Text',
      options: [
        { label: 'Text', value: 'Text' },
        { label: 'Image', value: 'Image' },
      ],
    },
  ],
  handles: [{ type: 'target', id: 'value' }],
};
