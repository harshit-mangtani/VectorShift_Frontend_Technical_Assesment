import { useCallback, useRef } from 'react';
import { Type } from 'lucide-react';
import { useStore } from '../../store';
import { useDebouncedField } from '../../hooks/useDebouncedField';
import { useAutosizeHeight } from '../../hooks/useAutosizeHeight';
import { parseVariables } from '../../lib/parseVariables';
import { clamp, widestLine } from '../../lib/measureText';

const MIN_WIDTH = 232;
const MAX_WIDTH = 460;
const H_PADDING = 44;
// One line of the field, and the vertical room each extra port needs beside it.
const LINE_HEIGHT = 34;
const PORT_SPACING = 22;

export const textWidth = (text) =>
  clamp(widestLine(text) + H_PADDING, MIN_WIDTH, MAX_WIDTH);

const TextEditor = ({ id, data }) => {
  const ref = useRef(null);
  const updateNodeField = useStore((s) => s.updateNodeField);

  const commit = useCallback(
    (next) => updateNodeField(id, 'text', next),
    [updateNodeField, id]
  );
  const [local, onChange] = useDebouncedField(data.text ?? '', commit, 100);
  useAutosizeHeight(ref, local);

  const { invalid } = parseVariables(local);

  // Ports need vertical separation, and that room is reserved on the textarea rather
  // than on the card. Reserving it on the card left the surplus as dead space beneath
  // the field — space that stayed once it appeared, because it tracked the port count
  // rather than the text. Here the same room is usable typing area instead.
  // A CSS min-height also outranks the inline height the autosize hook writes, so the
  // field can still grow past it but never collapses under it.
  const ports = parseVariables(data.text ?? '').variables.length;
  const reserved = LINE_HEIGHT + Math.max(0, ports - 1) * PORT_SPACING;

  return (
    <div className="space-y-1">
      <label className="field-label" htmlFor={`${id}-text`}>
        Text
      </label>
      <textarea
        id={`${id}-text`}
        ref={ref}
        rows={1}
        className="field-input nodrag resize-none overflow-hidden font-mono text-[13px] leading-5"
        style={{ minHeight: reserved }}
        value={local}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Write text, or reference inputs with {{variable}}"
      />
      {invalid.length > 0 && (
        <p className="text-2xs text-amber-600">
          Not a valid variable name: {invalid.join(', ')}
        </p>
      )}
    </div>
  );
};

export const textConfig = {
  type: 'text',
  label: 'Text',
  description: 'Compose text with {{variables}}',
  icon: Type,
  category: 'utility',
  defaultData: { text: '{{input}}' },
  render: TextEditor,
  // Ports derive from the text itself — the same mechanism any node can opt into.
  // The id is a positional slot, deliberately independent of the variable name: an id
  // built from the name would make every rename a remove-and-recreate, which forces
  // React Flow to re-measure and leaves connections pointing at a handle it has not
  // measured yet. Renaming now only changes `label`.
  handles: (data) => [
    ...parseVariables(data.text).variables.map((name, index) => ({
      type: 'target',
      id: `in-${index}`,
      label: name,
    })),
    { type: 'source', id: 'output' },
  ],
  // Height is left to the content: the field reserves the room its ports need, so the
  // card never has to be padded out beyond what it actually shows.
  size: (data) => ({ width: textWidth(data.text ?? '') }),
  outputs: [
    { key: 'output', type: 'Text', description: 'The composed text' },
  ],
};
