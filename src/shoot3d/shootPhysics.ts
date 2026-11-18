// Mutable per-frame state for the aim-and-shoot prototype. Same pattern as
// the SQL Quest lane-runner: kept outside React state so the 60fps loop
// never triggers a re-render — only discrete events cross back into React.

export const BASE_SPEED = 5.2;
export const BOOST_SPEED = 8.2;
export const BOOST_DURATION = 2.0;
export const MAX_ENERGY = 100;
export const MISS_ENERGY_COST = 18;

export interface Projectile {
  id: number;
  fromX: number;
  fromY: number;
  targetX: number;
  targetY: number;
  z: number; // world-z the shot was fired at (fixed; only its t changes)
  startZ: number;
  t: number; // 0..1 travel progress
}

export interface ShootPhysics {
  z: number;
  /** Index (0/1/2) into the current gate's scattered bug positions —
   *  cycling through live targets, not steering between fixed lanes. */
  aim: 0 | 1 | 2;
  boostTimer: number;
  bumpTimer: number;
  energy: number;
  paused: boolean;
  passedGateIds: Set<string>;
  projectiles: Projectile[];
  nextProjectileId: number;
}

export function createShootPhysics(): ShootPhysics {
  return {
    z: 0,
    aim: 1,
    boostTimer: 0,
    bumpTimer: 0,
    energy: MAX_ENERGY,
    paused: false,
    passedGateIds: new Set(),
    projectiles: [],
    nextProjectileId: 1,
  };
}

export function currentSpeed(p: ShootPhysics): number {
  if (p.bumpTimer > 0) return BASE_SPEED * 0.4;
  return p.boostTimer > 0 ? BOOST_SPEED : BASE_SPEED;
}
