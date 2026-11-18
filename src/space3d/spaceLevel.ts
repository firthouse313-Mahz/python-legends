// Level 1 ("Orbit Cleanup") content — three distinct systems per the
// design brief, not one mechanic wearing three names:
//
// 1. Planets: physical hazards to dodge. Hit one -> lose a life, and it
//    bursts into comets that keep flying as real obstacles afterward.
// 2. Ambient debris/plastic: plain fly-through pickups, no questions —
//    just the "clean the galaxy" energy trickle.
// 3. Enemy UFOs: the actual Python question encounters. Answering
//    correctly (flying into the right answer pod and firing) destroys
//    the UFO, restores energy, AND restores one lost life if any are
//    missing. A wrong pod does nothing — no penalty, just doesn't work.

export interface PlanetHazard {
  id: string;
  x: number;
  y: number;
  z: number;
  radius: number;
  color: string;
  ringColor?: string;
}

export interface DebrisPickup {
  id: string;
  x: number;
  y: number;
  z: number;
}

export interface EnemyAnswerOption {
  text: string;
  correct: boolean;
}

export interface EnemyEncounter {
  id: string;
  z: number;
  prompt: string;
  options: [EnemyAnswerOption, EnemyAnswerOption, EnemyAnswerOption];
  positions: [[number, number], [number, number], [number, number]];
}

export const PLANETS: PlanetHazard[] = [
  { id: 'p1', x: -1.6, y: 2.2, z: 40, radius: 0.55, color: '#c97a3a', ringColor: '#e8a85a' },
  { id: 'p2', x: 1.5, y: 1.3, z: 76, radius: 0.65, color: '#5b78bd' },
  { id: 'p3', x: -1.1, y: 1.1, z: 108, radius: 0.7, color: '#b5452f' },
];

// Plain ambient pickups — no questions, no shooting, just fly through.
export const DEBRIS_PICKUPS: DebrisPickup[] = [
  { id: 'deb1', x: 0.9, y: 1.4, z: 14 },
  { id: 'deb2', x: -0.7, y: 2.1, z: 18 },
  { id: 'deb3', x: 1.2, y: 2.4, z: 30 },
  { id: 'deb4', x: -1.1, y: 1.6, z: 55 },
  { id: 'deb5', x: 0.4, y: 2.8, z: 62 },
  { id: 'deb6', x: -0.6, y: 1.2, z: 88 },
  { id: 'deb7', x: 1.0, y: 2.0, z: 100 },
];

export const ENEMY_ENCOUNTERS: EnemyEncounter[] = [
  {
    id: 'e1',
    z: 24,
    prompt: 'An enemy UFO blocks the way! Shoot the line that correctly prints Hello, World!',
    options: [
      { text: 'print(Hello, World!)', correct: false },
      { text: 'print("Hello, World!")', correct: true },
      { text: 'echo "Hello, World!"', correct: false },
    ],
    positions: [
      [-1.8, 1.4],
      [0.3, 2.6],
      [1.7, 1.2],
    ],
  },
  {
    id: 'e2',
    z: 50,
    prompt: 'x = 5. Destroy the UFO carrying the correct data type of x.',
    options: [
      { text: 'str', correct: false },
      { text: 'int', correct: true },
      { text: 'bool', correct: false },
    ],
    positions: [
      [1.6, 2.4],
      [-0.4, 1.3],
      [-1.9, 2.8],
    ],
  },
  {
    id: 'e3',
    z: 72,
    prompt: 'Destroy the UFO with the correct way to assign 10 to a variable.',
    options: [
      { text: 'name == 10', correct: false },
      { text: '10 = name', correct: false },
      { text: 'name = 10', correct: true },
    ],
    positions: [
      [-1.4, 2.0],
      [1.5, 1.4],
      [0.1, 2.9],
    ],
  },
  {
    id: 'e4',
    z: 96,
    prompt: 'What does print(2 + 3) output? Destroy that UFO.',
    options: [
      { text: '23', correct: false },
      { text: '5', correct: true },
      { text: 'Error', correct: false },
    ],
    positions: [
      [1.3, 1.5],
      [-1.0, 2.7],
      [0.5, 1.1],
    ],
  },
];

export const LEVEL_END_Z = 124;
