import { Eraser, Globe } from 'lucide-react';

const validUrl = (value) => {
  if (!value) return null;
  try {
    new URL(value);
    return null;
  } catch {
    return 'Enter a full URL, e.g. https://api.example.com';
  }
};

const validJson = (value) => {
  if (!value?.trim()) return null;
  try {
    JSON.parse(value);
    return null;
  } catch {
    return 'Invalid JSON';
  }
};

// Demonstrates: per-field validation across three different field types.
export const apiRequestConfig = {
  type: 'apiRequest',
  label: 'API Request',
  description: 'Call an external endpoint',
  icon: Globe,
  category: 'data',
  size: { width: 264 },
  fields: [
    {
      key: 'method',
      type: 'select',
      label: 'Method',
      help: 'GET and DELETE send no body; the body port is ignored for those.',
      defaultValue: 'GET',
      options: ['GET', 'POST', 'PUT', 'DELETE'].map((m) => ({
        label: m,
        value: m,
      })),
    },
    {
      key: 'url',
      type: 'text',
      label: 'URL',
      required: true,
      help: 'Absolute URL including the scheme, e.g. https://api.example.com/v1.',
      defaultValue: 'https://api.example.com/v1',
      validate: validUrl,
    },
    {
      key: 'headers',
      type: 'textarea',
      label: 'Headers (JSON)',
      help: 'A flat JSON object. Authorization goes here rather than in the URL.',
      defaultValue: '{}',
      rows: 2,
      validate: validJson,
    },
    {
      key: 'followRedirects',
      type: 'toggle',
      label: 'Follow redirects',
      help: 'Chase 3xx responses automatically, up to five hops.',
      defaultValue: true,
    },
    {
      key: 'timeout',
      type: 'number',
      label: 'Timeout (ms)',
      help: 'How long to wait before giving up and taking the error branch.',
      defaultValue: 5000,
      numeric: { min: 100, max: 60000, step: 100 },
    },
    {
      type: 'action',
      label: 'Clear headers',
      help: 'Empties the headers object back to {}.',
      icon: Eraser,
      run: (_, set) => set('headers', '{}'),
    },
  ],
  handles: [
    { type: 'target', id: 'body', label: 'body' },
    { type: 'source', id: 'response', label: 'ok' },
    { type: 'source', id: 'error', label: 'error' },
  ],
  outputs: [
    { key: 'body', type: 'JSON', description: 'Parsed response body' },
    { key: 'status', type: 'Integer', description: 'HTTP status code', advanced: true },
    { key: 'headers', type: 'JSON', description: 'Response headers', advanced: true },
    { key: 'duration_ms', type: 'Integer', description: 'Round-trip time', advanced: true },
  ],
};
