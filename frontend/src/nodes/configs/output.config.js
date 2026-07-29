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
      help: 'The key this result is returned under.',
      defaultValue: (id) => id.replace('customOutput-', 'output_'),
    },
    {
      key: 'outputType',
      type: 'select',
      label: 'Type',
      help: 'How the result is rendered when the pipeline finishes.',
      defaultValue: 'Text',
      options: [
        { label: 'Text', value: 'Text' },
        { label: 'Image', value: 'Image' },
      ],
    },
  ],
  handles: [{ type: 'target', id: 'value' }],
};
