import { Bot, RotateCcw } from 'lucide-react';

const DEFAULTS = {
  system: 'You are a helpful assistant. Answer using the provided context.',
  prompt: 'Answer the question using {{context}}.',
};

export const llmConfig = {
  type: 'llm',
  label: 'LLM',
  description: 'Run a prompt through a model',
  icon: Bot,
  category: 'llm',
  size: { width: 296 },
  fields: [
    {
      key: 'system',
      type: 'textarea',
      label: 'System (Instructions)',
      required: true,
      help: 'Standing instructions sent ahead of every prompt. Sets role and tone.',
      defaultValue: DEFAULTS.system,
      rows: 3,
    },
    {
      key: 'prompt',
      type: 'textarea',
      label: 'Prompt',
      required: true,
      help: 'The request itself. Reference an upstream node as {{node_id.field}}.',
      defaultValue: DEFAULTS.prompt,
      rows: 3,
    },
    {
      key: 'model',
      type: 'select',
      label: 'Model',
      help: 'Larger models reason better; smaller ones cost less and reply faster.',
      defaultValue: 'gpt-4o',
      options: [
        { label: 'GPT-4o', value: 'gpt-4o' },
        { label: 'Claude Opus', value: 'claude-opus' },
        { label: 'Llama 3', value: 'llama-3' },
      ],
    },
    {
      key: 'stream',
      type: 'toggle',
      label: 'Stream response',
      help: 'Emit tokens as they arrive instead of waiting for the whole reply.',
      defaultValue: false,
    },
    {
      key: 'useOwnKey',
      type: 'checkbox',
      label: 'Use personal API key',
      help: 'Bill this node to your own account rather than workspace credits.',
      defaultValue: false,
    },
    {
      key: 'apiKey',
      type: 'password',
      label: 'API key',
      required: true,
      help: 'Stored with the pipeline and never displayed again once saved.',
      defaultValue: '',
      visibleIf: (data) => Boolean(data.useOwnKey),
    },
    {
      type: 'action',
      label: 'Reset instructions',
      help: 'Restores System and Prompt to their defaults.',
      icon: RotateCcw,
      run: (_, set) => {
        set('system', DEFAULTS.system);
        set('prompt', DEFAULTS.prompt);
      },
    },
  ],
  handles: [
    { type: 'target', id: 'system', label: 'system' },
    { type: 'target', id: 'prompt', label: 'prompt' },
    { type: 'source', id: 'response' },
  ],
  outputs: [
    { key: 'response', type: 'Text', description: 'The output of the model' },
    {
      key: 'tokens_used',
      type: 'Integer',
      description: 'Prompt plus completion',
      advanced: true,
    },
    {
      key: 'finish_reason',
      type: 'Text',
      description: 'Why generation stopped',
      advanced: true,
    },
  ],
};
