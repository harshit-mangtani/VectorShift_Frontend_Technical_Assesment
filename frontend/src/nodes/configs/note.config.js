import { useCallback, useRef } from 'react';
import { StickyNote } from 'lucide-react';
import { useStore } from '../../store';
import { useDebouncedField } from '../../hooks/useDebouncedField';
import { useAutosizeHeight } from '../../hooks/useAutosizeHeight';

const NoteBody = ({ id, data }) => {
  const ref = useRef(null);
  const updateNodeField = useStore((s) => s.updateNodeField);
  const commit = useCallback(
    (next) => updateNodeField(id, 'note', next),
    [updateNodeField, id]
  );
  const [local, onChange] = useDebouncedField(data.note ?? '', commit, 100);
  useAutosizeHeight(ref, local, 240);

  return (
    <textarea
      ref={ref}
      aria-label="Note"
      rows={2}
      className="nodrag w-full resize-none overflow-hidden border-0 bg-transparent p-0 text-sm
                 text-amber-900 outline-none placeholder:text-amber-700/50"
      value={local}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Add a note…"
    />
  );
};

// Demonstrates the degenerate case: no handles, no header, fully custom body.
export const noteConfig = {
  type: 'note',
  label: 'Note',
  icon: StickyNote,
  category: 'utility',
  bare: true,
  className: 'border-amber-200 bg-amber-50',
  defaultData: { note: '' },
  render: NoteBody,
  handles: [],
  size: { width: 200 },
};
