import clsx from 'clsx';

/**
 * A switch, not a checkbox. Both write a boolean, but a checkbox reads as "tick this if
 * it applies" and a switch reads as "this is on or off right now" — and when a config
 * gives it two labels it can name both states rather than leaving the off case unsaid.
 */
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
        {/* left-0.5 is required, not decorative: without an explicit inset the knob
            falls back to its static position, which a button centres — so it sat right
            of middle when off and slid past the track when on. */}
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
