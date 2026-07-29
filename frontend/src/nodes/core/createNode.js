import { memo, useEffect } from 'react';
import { useUpdateNodeInternals } from 'reactflow';
import { useStore } from '../../store';
import { BaseNode } from './BaseNode';
import { Field } from './Field';

const resolve = (value, data) =>
  typeof value === 'function' ? value(data) : value;

export const resolveHandles = (config, data) => resolve(config.handles, data);
export const resolveOutputs = (config, data) => resolve(config.outputs, data) ?? [];

/**
 * Turns a NodeConfig into a React Flow node component. Adding a node type means
 * writing a config — never touching this file.
 */
export const createNode = (config) => {
  const Node = ({ id, data, selected }) => {
    const updateNodeInternals = useUpdateNodeInternals();
    const pruneEdges = useStore((s) => s.pruneEdges);

    const handles = resolveHandles(config, data) ?? [];
    const handleKey = handles.map((h) => h.id).join('|');

    const outputs = resolveOutputs(config, data);

    const size = resolve(config.size, data);
    // Outputs sit beside the body, so gaining or losing one changes the card's width and
    // moves the right-hand ports just as a size change does.
    const sizeKey = `${size?.width ?? ''}:${size?.minHeight ?? ''}:${outputs.length}`;

    // React Flow caches handle offsets at mount and recomputes them only here. A card
    // that resizes (the Text node grows as you type) moves its right-hand ports, so the
    // size has to trigger a re-measure as well as the port set.
    useEffect(() => {
      updateNodeInternals(id);
    }, [id, handleKey, sizeKey, updateNodeInternals]);

    // Ports removed: drop the edges that pointed at them. Renames never land here,
    // because ids are positional and independent of the label.
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

  // Position is applied by React Flow as a wrapper transform, so ignoring it here keeps
  // node bodies from re-rendering on every frame of a drag.
  return memo(
    Node,
    (a, b) => a.id === b.id && a.data === b.data && a.selected === b.selected
  );
};
