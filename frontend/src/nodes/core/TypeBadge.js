import clsx from 'clsx';

/** The lavender type pill used on field labels and in the outputs table. */
export const TypeBadge = ({ children, className }) => (
  <span
    className={clsx(
      'shrink-0 rounded bg-brand px-1.5 py-px font-medium leading-4',
      'text-[0.625rem] tracking-wide text-white',
      className
    )}
  >
    {children}
  </span>
);
