import clsx from 'clsx';

export const ToggleField = ({ id, labels, value, onChange, ...aria }) => {
  const [off, on] = labels ?? [];
  const checked = Boolean(value);

  return (
    <span className="flex items-center gap-2">
      {off && (
        <span className={clsx('text-2xs', checked ? 'text-muted' : 'font-medium text-ink')}>
          {off}
        </span>
      )}

      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        {...aria}
        className={clsx(
          'nodrag relative h-[18px] w-8 shrink-0 rounded-full transition-colors duration-200',
          'focus:outline-none focus-visible:ring-4 focus-visible:ring-brand/25',
          checked ? 'bg-brand' : 'bg-muted/30'
        )}
      >
        {/* left-0.5 is required: a button centres an inset-less absolute child. */}
        <span
          className={clsx(
            'absolute left-0.5 top-0.5 h-3.5 w-3.5 rounded-full bg-white shadow-sm',
            'transition-transform duration-200 ease-out',
            checked ? 'translate-x-[14px]' : 'translate-x-0'
          )}
        />
      </button>

      {on && (
        <span className={clsx('text-2xs', checked ? 'font-medium text-ink' : 'text-muted')}>
          {on}
        </span>
      )}
    </span>
  );
};
