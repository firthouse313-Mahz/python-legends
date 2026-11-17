// Visual identity for the World Map's banner cards — one bold color per
// world, as the brief asks for (Loop Kingdom blue, Function Castle purple,
// Data Structure City green, Coding Battle orange), plus a small inline-SVG
// emblem per world so each banner reads as its own place rather than a
// reskinned rectangle. Purely presentational: nothing here is read by
// progressService or any game logic.

import type { ReactElement } from 'react';

export interface WorldVisual {
  accent: string;
  accentSoft: string;
  glow: string;
  Icon: (props: { className?: string }) => ReactElement;
}

function CastleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M10 56V30h6v-8h6v8h4V22h6v8h4v-8h6v8h6v8h6v26H10z"
        fill="currentColor"
        opacity="0.22"
      />
      <path
        d="M10 56V30h6v-8h6v8h4V22h6v8h4v-8h6v8h6v8h6v26H10z"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      <rect x="27" y="40" width="10" height="16" fill="currentColor" opacity="0.5" />
      <path d="M27 40a5 5 0 0 1 10 0" stroke="currentColor" strokeWidth="2.2" fill="none" />
    </svg>
  );
}

function ForestIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M22 38l-8 14h18l-8-14z" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" fill="currentColor" fillOpacity="0.25" />
      <path d="M22 28l-10 16h20l-10-16z" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" fill="currentColor" fillOpacity="0.3" />
      <path d="M42 34l-9 16h18l-9-16z" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" fill="currentColor" fillOpacity="0.25" />
      <path d="M42 22l-11 18h22l-11-18z" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" fill="currentColor" fillOpacity="0.3" />
      <rect x="20" y="50" width="4" height="8" fill="currentColor" opacity="0.6" />
      <rect x="40" y="50" width="4" height="8" fill="currentColor" opacity="0.6" />
    </svg>
  );
}

function LoopCrownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M14 26c0-9 8-16 18-16s18 7 18 16-8 16-18 16-18-7-18-16z"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeDasharray="7 5"
      />
      <path d="M22 44l10 10 10-10" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx="32" cy="26" r="6" fill="currentColor" opacity="0.5" />
    </svg>
  );
}

function CitySkylineIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="30" width="10" height="26" fill="currentColor" opacity="0.3" stroke="currentColor" strokeWidth="2" />
      <rect x="20" y="18" width="12" height="38" fill="currentColor" opacity="0.4" stroke="currentColor" strokeWidth="2" />
      <rect x="34" y="26" width="10" height="30" fill="currentColor" opacity="0.3" stroke="currentColor" strokeWidth="2" />
      <rect x="46" y="12" width="10" height="44" fill="currentColor" opacity="0.5" stroke="currentColor" strokeWidth="2" />
      <path d="M49 12V6M46 9h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function BattleSwordsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 14l20 20M34 34l16 16M14 14l-2 6 6-2M48 48l2 6-6-2" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M50 14L30 34M30 34L14 50M50 14l2 6-6-2M14 50l-2 6 6-2" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const DEFAULT_VISUAL: WorldVisual = {
  accent: '#5bc8f5',
  accentSoft: 'rgba(91, 200, 245, 0.18)',
  glow: 'rgba(91, 200, 245, 0.4)',
  Icon: CastleIcon,
};

export const WORLD_VISUALS: Record<string, WorldVisual> = {
  'world-1': { accent: '#34d399', accentSoft: 'rgba(52, 211, 153, 0.18)', glow: 'rgba(52, 211, 153, 0.4)', Icon: ForestIcon },
  'world-2': { accent: '#38bdf8', accentSoft: 'rgba(56, 189, 248, 0.18)', glow: 'rgba(56, 189, 248, 0.4)', Icon: LoopCrownIcon },
  'world-3': { accent: '#a855f7', accentSoft: 'rgba(168, 85, 247, 0.18)', glow: 'rgba(168, 85, 247, 0.4)', Icon: CastleIcon },
  'world-4': { accent: '#10e0a0', accentSoft: 'rgba(16, 224, 160, 0.18)', glow: 'rgba(16, 224, 160, 0.4)', Icon: CitySkylineIcon },
  'world-5': { accent: '#f97316', accentSoft: 'rgba(249, 115, 22, 0.18)', glow: 'rgba(249, 115, 22, 0.4)', Icon: BattleSwordsIcon },
};

export function visualFor(worldId: string): WorldVisual {
  return WORLD_VISUALS[worldId] ?? DEFAULT_VISUAL;
}
