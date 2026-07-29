import { Info } from 'lucide-react';
import { TypeBadge } from './TypeBadge';

// What each control accepts, shown as a badge so the node's shape is readable without
// clicking into it. `badge: null` in a config opts out.
const BADGE = {
  text: 'Text',
  textarea: 'Text',
  number: 'Number',
  password: 'Secret',
  select: 'Dropdown',
  // checkbox and toggle carry none: the control already says it is a yes/no.
};

export const badgeFor = (field) =>
  field.badge === undefined ? BADGE[field.type] : field.badge;

/**
 * Label row for one field: name, required marker, help, and the type badge.
 *
 * Everything except the name sits *outside* the <label>, so the control's accessible
 * name stays exactly `field.label` — `getByLabelText(label)` has to keep working, and a
 * screen reader shouldn't read "Endpoint star info Text".
 */
export const FieldLabel = ({ field, htmlFor, helpId }) => {
  const badge = badgeFor(field);

  return (
    <div className="flex items-center gap-1">
      <label className="field-label" htmlFor={htmlFor}>
        {field.label}
      </label>

      {field.required && (
        <span className="text-2xs leading-4 text-red-500" aria-hidden="true">
          *
        </span>
      )}

      {/* The tooltip is built rather than left to the `title` attribute: lucide renders an
          <svg>, and a title *attribute* on an SVG element does not reliably produce a
          tooltip — SVG expects a <title> child — so the help text was silently invisible.
          A styled bubble also appears immediately instead of after the UA's ~1s delay.

          Two copies of the string: the bubble is aria-hidden, and the sr-only span is what
          aria-describedby points at. A display-toggled bubble would be unreachable to a
          screen reader at the moment the control is focused. */}
      {field.help && (
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
