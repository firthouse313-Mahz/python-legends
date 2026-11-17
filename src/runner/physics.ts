// Shared mutable physics state for the runner, kept in a plain ref object
// (not React state) so the 60fps movement loop never triggers a React
// re-render. Discrete events (a hit, a collectible, a gate reached) are
// the only things that cross back into React state, via callbacks.

export interface RunnerPhysics {
  x: number;
  y: number;
  vy: number;
  sliding: boolean;
  slideTimer: number;
  grounded: boolean;
  doubleJumpUsed: boolean;
  boostTimer: number;
  shield: boolean;
  jumpQueued: boolean;
  slideQueued: boolean;
  /** True whenever a gate/boss overlay or the pause menu has stopped the run. */
  paused: boolean;
  /** Mirrors the HUD's energy React state, so the 60fps loop (the chaser's
   *  distance) can read it without re-rendering the scene every hit. */
  energy: number;
  hitIds: Set<string>;
  collectedIds: Set<string>;
  completedGates: Set<string>;
  /** Small hit-flash timer, purely visual. */
  flashTimer: number;
}

export const BASE_SPEED = 6.2;
export const BOOST_SPEED_MULT = 1.65;
/** How much faster the run gets by the very end of a world's track (on top
 *  of that world's own base multiplier) — the chase gets tighter as you go,
 *  instead of every level feeling the same speed. */
export const MAX_PROGRESS_SPEED_BONUS = 0.4;

/** The run speed at a given point in a world, after both that world's own
 *  base multiplier (harder worlds start faster) and how far along its
 *  track the player has gotten (each world ramps up toward its own end). */
export function speedAt(x: number, trackEndX: number, worldSpeedMult: number): number {
  const progress = trackEndX > 0 ? Math.min(1, Math.max(0, x / trackEndX)) : 0;
  return BASE_SPEED * worldSpeedMult * (1 + progress * MAX_PROGRESS_SPEED_BONUS);
}
export const GRAVITY = -20;
export const JUMP_VY = 7.4;
export const DOUBLE_JUMP_VY = 6.2;
export const JUMP_CLEAR_Y = 0.85; // min height to clear a 'low' obstacle
export const SLIDE_DURATION = 0.55;
export const OBSTACLE_HIT_RADIUS = 0.55;
export const COLLECT_RADIUS = 0.75;

export function createPhysics(startX: number): RunnerPhysics {
  return {
    x: startX,
    y: 0,
    vy: 0,
    sliding: false,
    slideTimer: 0,
    grounded: true,
    doubleJumpUsed: false,
    boostTimer: 0,
    shield: false,
    jumpQueued: false,
    slideQueued: false,
    paused: false,
    energy: 100,
    hitIds: new Set(),
    collectedIds: new Set(),
    completedGates: new Set(),
    flashTimer: 0,
  };
}
