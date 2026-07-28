import { Bot } from 'lucide-react';

export const llmConfig = {
  type: 'llm',
  label: 'LLM',
  description: 'Run a prompt through a model',
  icon: Bot,
  category: 'llm',
  fields: [
    {
      key: 'model',
      type: 'select',
      label: 'Model',
      defaultValue: 'gpt-4o',
      options: [
        { label: 'GPT-4o', value: 'gpt-4o' },
        { label: 'Claude Opus', value: 'claude-opus' },
        { label: 'Llama 3', value: 'llama-3' },
      ],
    },
    {
      key: 'temperature',
      type: 'number',
      label: 'Temperature',
      defaultValue: 0.7,
      numeric: { min: 0, max: 2, step: 0.1 },
    },
  ],
  handles: [
    { type: 'target', id: 'system', label: 'system' },
    { type: 'target', id: 'prompt', label: 'prompt' },
    { type: 'source', id: 'response', label: 'response' },
  ],
};
