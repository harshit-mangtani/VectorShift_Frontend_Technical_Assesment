import { Info } from 'lucide-react';
import { TypeBadge } from './TypeBadge';

const BADGE = {
  text: 'Text',
  textarea: 'Text',
  number: 'Number',
  password: 'Secret',
  select: 'Dropdown',
};

export const badgeFor = (field) =>
  field.badge === undefined ? BADGE[field.type] : field.badge;

export const FieldLabel = ({ field, htmlFor, helpId }) => {
  const badge = badgeFor(field);

  return (
    <div className="flex items-center gap-1">
      {/* Only the name goes inside <label>, so the accessible name stays exact. */}
      <label className="field-label" htmlFor={htmlFor}>
        {field.label}
      </label>

      {field.required && (
        <span className="text-2xs leading-4 text-red-500" aria-hidden="true">
          *
        </span>
      )}

      {field.help && (
        // A title attribute on an <svg> does not render a tooltip; SVG wants <title>.
        <span className="group/help relative inline-flex shrink-0">
          <Info
            size={11}
            className="text-muted/70 transition-colors group-hover/help:text-brand"
            aria-hidden="true"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-1.5 w-44
                       -translate-x-1/2 rounded-md bg-ink/95 px-2 py-1 text-[0.625rem]
                       font-normal normal-case leading-snug tracking-normal text-white
                       opacity-0 shadow-lift transition-opacity duration-150
                       group-hover/help:opacity-100"
          >
            {field.help}
          </span>
          <span id={helpId} className="sr-only">
            {field.help}
          </span>
        </span>
      )}

      {badge && <TypeBadge className="ml-auto">{badge}</TypeBadge>}
    </div>
  );
};
