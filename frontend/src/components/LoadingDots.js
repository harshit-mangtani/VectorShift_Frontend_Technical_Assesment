const DELAYS = ['0ms', '150ms', '300ms'];

export const LoadingDots = () => (
  <span className="flex items-center gap-[3px]" aria-hidden="true">
    {DELAYS.map((delay) => (
      <span
        key={delay}
        style={{ animationDelay: delay }}
        className="h-[5px] w-[5px] animate-dot rounded-full bg-current"
      />
    ))}
  </span>
);
