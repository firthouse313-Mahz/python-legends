// Free-movement space-cleanup prototype. The ship moves continuously in
// x/y (a real dodge, not a 3-lane strafe) — planets are physical hazards
// to steer around, comets from a burst planet are real moving hazards
// too, ambient debris are passive pickups, and UFOs are the actual
// Python-question combat encounters.

export const BASE_SPEED = 6.0;
export const SHIP_MOVE_SPEED = 3.4;
export const BOUNDS_X = 2.6;
export const BOUNDS_Y: [number, number] = [0.2, 3.6];
export const MAX_LIVES = 3;
export const MAX_ENERGY = 100;
export const DEBRIS_ENERGY_GAIN = 6;
export const UFO_ENERGY_GAIN = 15;
export const COMET_LIFE_RISK = true; // a comet hit costs a life, like a planet

export interface Projectile {
  id: number;
  x: number;
  y: number;
  z: number; // world-z target (the UFO's z)
  startZ: number;
  t: number;
}

/** A single comet shard, spawned when a planet bursts — keeps moving
 *  forward relative to the galaxy (toward the ship) for a few seconds as
 *  a real obstacle, not just a decorative particle. */
export interface CometShard {
  id: string;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  age: number;
}

export interface SpacePhysics {
  z: number;
  x: number; // ship's current world-x, continuously controlled
  y: number; // ship's current world-y, continuously controlled
  moveX: number; // -1, 0, 1 input state
  moveY: number;
  lives: number;
  energy: number;
  invulnTimer: number; // brief i-frames after a hit, so one collision can't chain
  boostTimer: number;
  paused: boolean;
  hitPlanetIds: Set<string>;
  collectedDebrisIds: Set<string>;
  resolvedEnemyIds: Set<string>;
  comets: CometShard[];
  nextCometId: number;
  projectiles: Projectile[];
  nextProjectileId: number;
}

export function createSpacePhysics(): SpacePhysics {
  return {
    z: 0,
    x: 0,
    y: 1.8,
    moveX: 0,
    moveY: 0,
    lives: MAX_LIVES,
    energy: MAX_ENERGY,
    invulnTimer: 0,
    boostTimer: 0,
    paused: false,
    hitPlanetIds: new Set(),
    collectedDebrisIds: new Set(),
    resolvedEnemyIds: new Set(),
    comets: [],
    nextCometId: 1,
    projectiles: [],
    nextProjectileId: 1,
  };
}

export function currentSpeed(p: SpacePhysics): number {
  return p.boostTimer > 0 ? BASE_SPEED * 1.4 : BASE_SPEED;
}
