import clsx from 'clsx';

export const ActionField = ({ field, data, set }) => {
  const { icon: Icon, label, tone } = field;

  return (
    <button
      type="button"
      onClick={() => field.run(data, set)}
      title={field.help}
      className={clsx(
        'nodrag flex w-full items-center justify-center gap-1.5 rounded-lg border',
        'px-2 py-1.5 text-2xs font-medium transition-all duration-150 active:scale-[.98]',
        'focus:outline-none focus-visible:ring-4 focus-visible:ring-brand/20',
        tone === 'danger'
          ? 'border-red-200 text-red-500 hover:border-red-300 hover:bg-red-50'
          : 'border-line text-muted hover:border-brand/40 hover:bg-brand/[0.06] hover:text-brand'
      )}
    >
      {Icon && <Icon size={12} strokeWidth={2.2} aria-hidden="true" />}
      {label}
    </button>
  );
};
