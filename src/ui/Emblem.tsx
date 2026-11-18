// Python Legends' own brand mark — reuses the game's existing Python
// Forest leaf-cluster icon (see worldMapTheme.tsx) as a small badge, so the
// top-level logo is drawn from the game's own established visual language
// instead of a bare 🐍 emoji standing in for a real identity.
export function Emblem({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="24" cy="24" r="23" fill="url(#pl-emblem-bg)" stroke="#1c6b2e" strokeWidth="2" />
      <g fill="#eafff0" fillOpacity="0.95">
        <path d="M17 29l-6 10h13l-6-10z" />
        <path d="M17 21l-7 11.5h14L17 21z" />
        <path d="M31 25l-6.5 11h13L31 25z" />
        <path d="M31 16l-8 13h16l-8-13z" />
      </g>
      <rect x="15.5" y="37.5" width="3" height="5.5" rx="1" fill="#eafff0" fillOpacity="0.8" />
      <rect x="29.5" y="37.5" width="3" height="5.5" rx="1" fill="#eafff0" fillOpacity="0.8" />
      <defs>
        <linearGradient id="pl-emblem-bg" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7de37d" />
          <stop offset="1" stopColor="#2fae4a" />
        </linearGradient>
      </defs>
    </svg>
  );
}
