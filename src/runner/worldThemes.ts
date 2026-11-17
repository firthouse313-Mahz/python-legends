// A unique visual identity per world, per the brief. Only colors (no
// external assets needed) — geometry stays the same primitives so the
// engine code doesn't need per-world branching, just a palette swap.

export interface WorldTheme {
  sky: string;
  ground: string;
  hill: string;
  tree: string;
  obstacle: string;
  gate: string;
}

export const WORLD_THEMES: Record<string, WorldTheme> = {
  'world-1': {
    sky: '#8fe3ff',
    ground: '#3f8f52',
    hill: '#4fae7a',
    tree: '#2f8f52',
    obstacle: '#c97a3a',
    gate: '#8a5bff',
  },
  'world-2': {
    // Loop Kingdom: a dusk-purple dragon's-lair palette, distinct from
    // Python Forest's bright daytime green.
    sky: '#7a6fc7',
    ground: '#3a2f63',
    hill: '#4a3d82',
    tree: '#2e2552',
    obstacle: '#b5452f',
    gate: '#ff5bd0',
  },
};

export function themeFor(worldId: string): WorldTheme {
  return WORLD_THEMES[worldId] ?? WORLD_THEMES['world-1'];
}
