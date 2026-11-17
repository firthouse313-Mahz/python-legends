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
  /** Base run-speed multiplier for this world — later worlds start faster,
   *  on top of the within-world ramp as you clear more levels. */
  speedMult: number;
  /** Color of the pursuing chaser that closes in when energy is low. */
  chaser: string;
}

export const WORLD_THEMES: Record<string, WorldTheme> = {
  'world-1': {
    sky: '#8fe3ff',
    ground: '#3f8f52',
    hill: '#4fae7a',
    tree: '#2f8f52',
    obstacle: '#c97a3a',
    gate: '#8a5bff',
    speedMult: 1,
    chaser: '#2f8f52',
  },
  'world-2': {
    // Loop Kingdom: a dusk-purple dragon's-lair palette, distinct from
    // Python Forest's bright daytime green. Starts faster than World 1 —
    // the second world should already feel like a step up before any
    // single level's own obstacles do the rest.
    sky: '#7a6fc7',
    ground: '#3a2f63',
    hill: '#4a3d82',
    tree: '#2e2552',
    obstacle: '#b5452f',
    gate: '#ff5bd0',
    speedMult: 1.15,
    chaser: '#ff5bd0',
  },
};

export function themeFor(worldId: string): WorldTheme {
  return WORLD_THEMES[worldId] ?? WORLD_THEMES['world-1'];
}
