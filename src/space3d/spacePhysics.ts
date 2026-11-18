// Free-movement space-cleanup prototype. Unlike the lane-based Bug Hunt
// mode, the ship moves continuously in x/y (a real dodge, not a 3-lane
// strafe) — planets are physical hazards to steer around, not just
// answer targets.

export const BASE_SPEED = 6.0;
export const SHIP_MOVE_SPEED = 3.4;
export const BOUNDS_X = 2.6;
export const BOUNDS_Y: [number, number] = [0.2, 3.6];
export const MAX_LIVES = 3;
export const MAX_ENERGY = 100;
export const WRONG_ENERGY_COST = 15;
export const RIGHT_ENERGY_GAIN = 12;

export interface Projectile {
  id: number;
  x: number;
  y: number;
  z: number; // world-z target (the debris item's z)
  startZ: number;
  t: number;
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
  resolvedDebrisIds: Set<string>;
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
    resolvedDebrisIds: new Set(),
    projectiles: [],
    nextProjectileId: 1,
  };
}

export function currentSpeed(p: SpacePhysics): number {
  return p.boostTimer > 0 ? BASE_SPEED * 1.4 : BASE_SPEED;
}
