import { memo, useEffect } from 'react';
import { useUpdateNodeInternals } from 'reactflow';
import { useStore } from '../../store';
import { BaseNode } from './BaseNode';
import { Field } from './Field';

const resolve = (value, data) =>
  typeof value === 'function' ? value(data) : value;

export const resolveHandles = (config, data) => resolve(config.handles, data);
export const resolveOutputs = (config, data) => resolve(config.outputs, data) ?? [];

export const createNode = (config) => {
  const Node = ({ id, data, selected }) => {
    const updateNodeInternals = useUpdateNodeInternals();
    const pruneEdges = useStore((s) => s.pruneEdges);

    const handles = resolveHandles(config, data) ?? [];
    const handleKey = handles.map((h) => h.id).join('|');

    const outputs = resolveOutputs(config, data);

    const size = resolve(config.size, data);

    const sizeKey = `${size?.width ?? ''}:${size?.minHeight ?? ''}:${outputs.length}`;

    useEffect(() => {
      updateNodeInternals(id);
    }, [id, handleKey, sizeKey, updateNodeInternals]);

    useEffect(() => {
      const valid = handleKey ? handleKey.split('|').map((h) => `${id}-${h}`) : [];
      pruneEdges(id, valid);
    }, [id, handleKey, pruneEdges]);

    const Custom = config.render;
    const fields = (config.fields ?? []).filter(
      (field) => !field.visibleIf || field.visibleIf(data)
    );

    return (
      <BaseNode
        id={id}
        config={config}
        handles={handles}
        outputs={outputs}
        selected={selected}
        size={size}
      >
        {Custom ? (
          <Custom id={id} data={data} />
        ) : (
          fields.map((field) => (
            <Field
              key={field.key ?? field.label}
              nodeId={id}
              field={field}
              data={data}
              value={data[field.key]}
            />
          ))
        )}
      </BaseNode>
    );
  };

  Node.displayName = `${config.label}Node`;

  // Position is excluded: React Flow moves nodes by transform, so bodies needn't render.
  return memo(
    Node,
    (a, b) => a.id === b.id && a.data === b.data && a.selected === b.selected
  );
};
