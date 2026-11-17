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
  hitIds: Set<string>;
  collectedIds: Set<string>;
  completedGates: Set<string>;
  /** Small hit-flash timer, purely visual. */
  flashTimer: number;
}

export const BASE_SPEED = 6.2;
export const BOOST_SPEED_MULT = 1.65;
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
    hitIds: new Set(),
    collectedIds: new Set(),
    completedGates: new Set(),
    flashTimer: 0,
  };
}
