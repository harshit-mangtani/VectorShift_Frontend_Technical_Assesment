import { createNode } from './core/createNode';
import { inputConfig } from './configs/input.config';
import { outputConfig } from './configs/output.config';
import { llmConfig } from './configs/llm.config';
import { textConfig } from './configs/text.config';
import { filterConfig } from './configs/filter.config';
import { transformConfig } from './configs/transform.config';
import { apiRequestConfig } from './configs/apiRequest.config';
import { databaseConfig } from './configs/database.config';
import { noteConfig } from './configs/note.config';

// Adding a node type: write a config, add it here. Nothing else in the app changes.
export const nodeConfigs = [
  inputConfig,
  outputConfig,
  llmConfig,
  textConfig,
  filterConfig,
  transformConfig,
  apiRequestConfig,
  databaseConfig,
  noteConfig,
];

export const configByType = Object.fromEntries(
  nodeConfigs.map((config) => [config.type, config])
);

// Built once at module scope — React Flow rebuilds its internals if this identity changes.
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

/** Seeds node.data from the config's defaults so no value lives only in component state. */
export const initialNodeData = (type, id) => {
  const config = configByType[type];
  const data = { id, nodeType: type, ...config.defaultData };
  for (const field of config.fields ?? []) {
    data[field.key] =
      typeof field.defaultValue === 'function'
        ? field.defaultValue(id)
        : field.defaultValue;
  }
  return data;
};
