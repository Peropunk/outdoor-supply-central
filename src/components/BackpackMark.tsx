/**
 * The Outdoor Supply Central backpack mark: JD's backpack-in-a-circle logo,
 * redrawn as a vector so it stays crisp from a browser tab to a sign. The pack
 * runs off the bottom of the circle, as in his original. Draws in the current
 * text colour (pine by default).
 */
export function BackpackMark({ className = "", title }: { className?: string; title?: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      fill="none"
      stroke="currentColor"
      strokeWidth="7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {title && <title>{title}</title>}
      <defs>
        <clipPath id="osc-mark-inside">
          <circle cx="100" cy="100" r="88" />
        </clipPath>
      </defs>
      <circle cx="100" cy="100" r="92" strokeWidth="8" />
      <g clipPath="url(#osc-mark-inside)">
        {/* carry loop */}
        <circle cx="100" cy="42" r="9" />
        {/* pack body, running off the bottom of the circle */}
        <path d="M46 210V80a28 28 0 0 1 28-28h52a28 28 0 0 1 28 28v130" />
        {/* lid pocket */}
        <rect x="80" y="68" width="40" height="17" rx="4" />
        {/* lid edge and buckles */}
        <path d="M46 112h108" />
        <rect x="66" y="100" width="13" height="25" rx="6.5" />
        <rect x="121" y="100" width="13" height="25" rx="6.5" />
        {/* front pocket */}
        <path d="M64 210v-64a8 8 0 0 1 8-8h56a8 8 0 0 1 8 8v64" />
        <path d="M64 158h72M84 158v14" />
      </g>
    </svg>
  );
}
