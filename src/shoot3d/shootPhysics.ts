// Mutable per-frame state for the aim-and-shoot prototype. Kept outside
// React state so the 60fps loop never triggers a re-render — only
// discrete events cross back into React.

export const BASE_SPEED = 5.2;
export const BOOST_SPEED = 8.2;
export const BOOST_DURATION = 2.0;
export const MAX_ENERGY = 100;
export const MISS_ENERGY_COST = 18;
export const LANE_LERP = 9; // how snappy the visible strafe feels

export interface Projectile {
  id: number;
  x: number; // fixed — fires straight ahead from wherever the player is aimed
  z: number; // world-z the gate sits at; only t changes
  startZ: number;
  t: number; // 0..1 travel progress
}

export interface ShootPhysics {
  z: number;
  /** Target lane (0/1/2 = left/mid/right). playerX lerps toward this. */
  aim: 0 | 1 | 2;
  /** The avatar's actual, currently-visible world-x — what the camera and
   *  render loop use, always a step behind `aim` while it catches up. */
  playerX: number;
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
    playerX: 0,
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
