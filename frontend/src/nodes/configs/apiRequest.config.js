import { Globe } from 'lucide-react';

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
      defaultValue: 'https://api.example.com/v1',
      validate: validUrl,
    },
    {
      key: 'headers',
      type: 'textarea',
      label: 'Headers (JSON)',
      defaultValue: '{}',
      rows: 2,
      validate: validJson,
    },
    {
      key: 'timeout',
      type: 'number',
      label: 'Timeout (ms)',
      defaultValue: 5000,
      numeric: { min: 100, max: 60000, step: 100 },
    },
  ],
  handles: [
    { type: 'target', id: 'body', label: 'body' },
    { type: 'source', id: 'response', label: 'ok' },
    { type: 'source', id: 'error', label: 'error' },
  ],
};
