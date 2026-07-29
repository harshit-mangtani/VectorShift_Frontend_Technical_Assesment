import { memo, useCallback, useId } from 'react';
import clsx from 'clsx';
import { useStore } from '../../store';
import { useDebouncedField } from '../../hooks/useDebouncedField';
import { SelectField } from './SelectField';
import { ToggleField } from './ToggleField';
import { ActionField } from './ActionField';
import { FieldLabel } from './FieldLabel';

const DEBOUNCED = new Set(['text', 'textarea', 'number', 'password']);
// Controls that sit beside their label rather than under it.
const INLINE = new Set(['checkbox', 'toggle']);
const isBlank = (value) => value === '' || value === null || value === undefined;

/**
 * Renders one FieldConfig against node.data. Free-text inputs debounce their commit;
 * discrete controls (select, checkbox, toggle) commit immediately.
 */
export const Field = memo(({ nodeId, field, data, value }) => {
  const inputId = useId();
  const helpId = `${inputId}-help`;
  const updateNodeField = useStore((s) => s.updateNodeField);

  const commit = useCallback(
    (next) => updateNodeField(nodeId, field.key, next),
    [updateNodeField, nodeId, field.key]
  );

  // Actions own no value, so they take the whole node and a setter instead.
  const setKey = useCallback(
    (key, next) => updateNodeField(nodeId, key, next),
    [updateNodeField, nodeId]
  );

  const [local, onChange] = useDebouncedField(value ?? '', commit);
  const debounced = DEBOUNCED.has(field.type);
  const current = debounced ? local : value;

  if (field.type === 'action') {
    return <ActionField field={field} data={data} set={setKey} />;
  }

  // A missing required value outranks any custom rule — there is nothing to validate yet.
  const error =
    field.required && isBlank(current)
      ? 'Required'
      : field.validate?.(current) ?? null;

  const inputClass = clsx('field-input nodrag', error && 'field-invalid');
  const set = (next) => (debounced ? onChange(next) : commit(next));
  const described = field.help ? { 'aria-describedby': helpId } : {};
  const flags = { ...described, 'aria-required': field.required || undefined };
  const inline = INLINE.has(field.type);

  const control =
    field.type === 'select' ? (
      <SelectField
        id={inputId}
        options={field.options}
        value={current}
        onChange={set}
        invalid={Boolean(error)}
        {...flags}
      />
    ) : field.type === 'toggle' ? (
      <ToggleField
        id={inputId}
        labels={field.labels}
        value={current}
        onChange={set}
        {...described}
      />
    ) : field.type === 'checkbox' ? (
      <input
        id={inputId}
        type="checkbox"
        className="h-4 w-4 rounded border-line text-brand nodrag focus:ring-brand/30"
        checked={Boolean(current)}
        onChange={(e) => set(e.target.checked)}
        {...described}
      />
    ) : field.type === 'textarea' ? (
      <textarea
        id={inputId}
        rows={field.rows ?? 3}
        className={clsx(inputClass, 'nowheel resize-none')}
        value={current ?? ''}
        onChange={(e) => set(e.target.value)}
        aria-invalid={Boolean(error)}
        {...flags}
      />
    ) : (
      <input
        id={inputId}
        type={field.type === 'number' ? 'number' : field.type === 'password' ? 'password' : 'text'}
        className={inputClass}
        value={current ?? ''}
        onChange={(e) => set(e.target.value)}
        aria-invalid={Boolean(error)}
        {...(field.numeric ?? {})}
        {...flags}
      />
    );

  // A switch or tick reads as one statement with its label, so it shares the row; a value
  // control needs the width and takes the line below.
  return inline ? (
    <div className="flex items-center justify-between gap-2">
      <FieldLabel field={field} htmlFor={inputId} helpId={helpId} />
      {control}
    </div>
  ) : (
    <div className="space-y-1">
      <FieldLabel field={field} htmlFor={inputId} helpId={helpId} />
      {control}
      {error && <p className="text-2xs text-red-500">{error}</p>}
    </div>
  );
});
