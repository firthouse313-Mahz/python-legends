// Level 1 ("Orbit Cleanup") content: planets to dodge (physical hazards —
// hit one and lose a life, and it bursts into comet shrapnel) and debris
// orbs to shoot, each carrying a Python answer. Shooting the correct
// debris cleans it up (the mission's actual goal) and restores energy;
// wrong debris costs energy but never a life — only a planet collision
// does that, same split as the uploaded design: mistakes on the
// knowledge check are free to make, mistakes on the flying are not.

export interface PlanetHazard {
  id: string;
  x: number;
  y: number;
  z: number;
  radius: number;
  color: string;
  ringColor?: string;
}

export interface DebrisOption {
  text: string;
  correct: boolean;
}

export interface DebrisCluster {
  id: string;
  z: number;
  prompt: string;
  options: [DebrisOption, DebrisOption, DebrisOption];
  positions: [[number, number], [number, number], [number, number]];
}

export const PLANETS: PlanetHazard[] = [
  { id: 'p1', x: -1.6, y: 2.2, z: 34, radius: 0.55, color: '#c97a3a', ringColor: '#e8a85a' },
  { id: 'p2', x: 1.5, y: 1.3, z: 58, radius: 0.65, color: '#5b78bd' },
  { id: 'p3', x: 0.2, y: 2.6, z: 82, radius: 0.5, color: '#8a5bff', ringColor: '#c9a8ff' },
  { id: 'p4', x: -1.3, y: 1.1, z: 104, radius: 0.7, color: '#b5452f' },
];

export const DEBRIS_CLUSTERS: DebrisCluster[] = [
  {
    id: 'd1',
    z: 22,
    prompt: 'Clean up the debris that correctly prints Hello, World!',
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
    id: 'd2',
    z: 46,
    prompt: 'x = 5. Collect the debris with the correct data type of x.',
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
    id: 'd3',
    z: 70,
    prompt: 'Collect the debris that correctly assigns 10 to a variable name.',
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
    id: 'd4',
    z: 94,
    prompt: 'What does print(2 + 3) output? Collect that debris.',
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

export const LEVEL_END_Z = 120;
