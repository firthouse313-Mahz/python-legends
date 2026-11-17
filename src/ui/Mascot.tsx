// A small original robot mascot (plain shapes, no external art) for the
// sidebar — purely decorative chrome, same spirit as the login screen's
// "PLAY. EXPLORE. CODE. CONQUER." tagline.
export function Mascot({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <line x1="60" y1="10" x2="60" y2="22" stroke="#2fb8ff" strokeWidth="3" strokeLinecap="round" />
      <circle cx="60" cy="8" r="4" fill="#21d0b8">
        <animate attributeName="opacity" values="1;0.4;1" dur="1.6s" repeatCount="indefinite" />
      </circle>
      <rect x="26" y="22" width="68" height="56" rx="18" fill="#17304a" stroke="#2fb8ff" strokeWidth="2.5" />
      <circle cx="46" cy="50" r="8" fill="#eaf6ff" />
      <circle cx="46" cy="50" r="3.2" fill="#0b1220" />
      <circle cx="74" cy="50" r="8" fill="#eaf6ff" />
      <circle cx="74" cy="50" r="3.2" fill="#0b1220" />
      <path d="M48 65q12 9 24 0" stroke="#21d0b8" strokeWidth="3" strokeLinecap="round" fill="none" />
      <rect x="10" y="38" width="10" height="22" rx="5" fill="#17304a" stroke="#2fb8ff" strokeWidth="2.2" />
      <path d="M15 38v-6" stroke="#2fb8ff" strokeWidth="3" strokeLinecap="round" />
      <rect x="100" y="38" width="10" height="22" rx="5" fill="#17304a" stroke="#2fb8ff" strokeWidth="2.2" />
      <rect x="40" y="86" width="40" height="26" rx="10" fill="#0e2338" stroke="#2fb8ff" strokeWidth="2.2" />
    </svg>
  );
}
