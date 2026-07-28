import { memo, useCallback, useId } from 'react';
import clsx from 'clsx';
import { useStore } from '../../store';
import { useDebouncedField } from '../../hooks/useDebouncedField';
import { SelectField } from './SelectField';

const DEBOUNCED = new Set(['text', 'textarea', 'number']);

/**
 * Renders one FieldConfig against node.data. Free-text inputs debounce their commit;
 * discrete controls (select, checkbox) commit immediately.
 */
export const Field = memo(({ nodeId, field, value }) => {
  const inputId = useId();
  const updateNodeField = useStore((s) => s.updateNodeField);

  const commit = useCallback(
    (next) => updateNodeField(nodeId, field.key, next),
    [updateNodeField, nodeId, field.key]
  );

  const [local, onChange] = useDebouncedField(value ?? '', commit);
  const debounced = DEBOUNCED.has(field.type);
  const current = debounced ? local : value;
  const error = field.validate ? field.validate(current) : null;

  const inputClass = clsx('field-input nodrag', error && 'field-invalid');
  const set = (next) => (debounced ? onChange(next) : commit(next));

  return (
    <div className="space-y-1">
      <label className="field-label" htmlFor={inputId}>
        {field.label}
      </label>

      {field.type === 'select' ? (
        <SelectField
          id={inputId}
          options={field.options}
          value={current}
          onChange={set}
          invalid={Boolean(error)}
        />
      ) : field.type === 'checkbox' ? (
        <input
          id={inputId}
          type="checkbox"
          className="h-4 w-4 rounded border-line text-brand nodrag focus:ring-brand/30"
          checked={Boolean(current)}
          onChange={(e) => set(e.target.checked)}
        />
      ) : field.type === 'textarea' ? (
        <textarea
          id={inputId}
          rows={field.rows ?? 3}
          className={clsx(inputClass, 'resize-none')}
          value={current ?? ''}
          onChange={(e) => set(e.target.value)}
          aria-invalid={Boolean(error)}
        />
      ) : (
        <input
          id={inputId}
          type={field.type === 'number' ? 'number' : 'text'}
          className={inputClass}
          value={current ?? ''}
          onChange={(e) => set(e.target.value)}
          aria-invalid={Boolean(error)}
          {...(field.numeric ?? {})}
        />
      )}

      {error && <p className="text-2xs text-red-500">{error}</p>}
    </div>
  );
});
