import { Webhook } from 'lucide-react';

export const webhookConfig = {
  type: 'webhook',
  label: 'Webhook',
  description: 'Start the pipeline from an HTTP call',
  icon: Webhook,
  category: 'io',
  fields: [
    {
      key: 'path',
      type: 'text',
      label: 'Path',
      required: true,
      help: 'Appended to your deployment URL. Must start with a slash.',
      defaultValue: '/hooks/incoming',
      validate: (value) =>
        value && !value.startsWith('/') ? 'Must start with /' : null,
    },
    {
      key: 'method',
      type: 'select',
      label: 'Method',
      help: 'Calls arriving with any other verb are ignored.',
      defaultValue: 'POST',
      options: ['POST', 'GET', 'PUT'].map((value) => ({ label: value, value })),
    },
    {
      key: 'verify',
      type: 'toggle',
      label: 'Verify signature',
      help: 'Reject calls that do not carry a signature matching the secret below.',
      defaultValue: true,
    },
    {
      key: 'secret',
      type: 'password',
      label: 'Signing secret',
      required: true,
      help: 'Shared with the caller, which signs each request body with it.',
      defaultValue: '',
      visibleIf: (data) => Boolean(data.verify),
    },
  ],
  handles: [{ type: 'source', id: 'payload' }],
  outputs: [
    { key: 'payload', type: 'JSON', description: 'Parsed request body' },
    { key: 'headers', type: 'JSON', description: 'Request headers', advanced: true },
    {
      key: 'received_at',
      type: 'Text',
      description: 'ISO timestamp of the call',
      advanced: true,
    },
  ],
};
