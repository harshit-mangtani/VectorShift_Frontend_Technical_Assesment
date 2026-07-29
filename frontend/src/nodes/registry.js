import { createNode } from './core/createNode';
import { inputConfig } from './configs/input.config';
import { outputConfig } from './configs/output.config';
import { llmConfig } from './configs/llm.config';
import { textConfig } from './configs/text.config';
import { filterConfig } from './configs/filter.config';
import { apiRequestConfig } from './configs/apiRequest.config';
import { webhookConfig } from './configs/webhook.config';
import { jsonParseConfig } from './configs/jsonParse.config';
import { noteConfig } from './configs/note.config';

export const nodeConfigs = [
  inputConfig,
  outputConfig,
  webhookConfig,
  llmConfig,
  textConfig,
  filterConfig,
  apiRequestConfig,
  jsonParseConfig,
  noteConfig,
];

export const configByType = Object.fromEntries(
  nodeConfigs.map((config) => [config.type, config])
);

export const nodeTypes = Object.fromEntries(
  nodeConfigs.map((config) => [config.type, createNode(config)])
);

const CATEGORY_ORDER = ['io', 'llm', 'logic', 'data', 'utility'];
const CATEGORY_LABEL = {
  io: 'Input / Output',
  llm: 'Models',
  logic: 'Logic',
  data: 'Data',
  utility: 'Utility',
};

export const toolbarGroups = CATEGORY_ORDER.map((category) => ({
  category,
  label: CATEGORY_LABEL[category],
  configs: nodeConfigs.filter((config) => config.category === category),
})).filter((group) => group.configs.length > 0);

export const initialNodeData = (type, id) => {
  const config = configByType[type];
  const data = { id, nodeType: type, ...config.defaultData };
  for (const field of config.fields ?? []) {
    if (!field.key) continue;
    data[field.key] =
      typeof field.defaultValue === 'function'
        ? field.defaultValue(id)
        : field.defaultValue;
  }
  return data;
};
