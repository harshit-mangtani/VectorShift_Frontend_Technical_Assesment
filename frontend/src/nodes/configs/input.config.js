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
      help: 'How downstream nodes refer to this value.',
      defaultValue: (id) => id.replace('customInput-', 'input_'),
    },
    {
      key: 'inputType',
      type: 'select',
      label: 'Type',
      help: 'What the pipeline expects to be handed when it runs.',
      defaultValue: 'Text',
      options: [
        { label: 'Text', value: 'Text' },
        { label: 'File', value: 'File' },
      ],
    },
  ],
  handles: [{ type: 'source', id: 'value' }],
  outputs: (data) => [
    {
      key: data.inputName || 'value',
      type: data.inputType ?? 'Text',
      description: 'The value supplied when the pipeline runs',
    },
  ],
};
