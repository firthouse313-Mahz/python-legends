// Each gate is a "shoot the correct answer" moment: three floating signs
// appear ahead, one per lane. The student aims (left/right) and fires —
// hitting the correct one keeps the run going at full speed with a boost;
// missing just costs a brief stumble, never a stop. Real code-writing
// stays in the separate lab overlay (PythonLabOverlay) — this mode is for
// fast concept checks only.

export interface ShootOption {
  text: string;
  correct: boolean;
}

export interface ShootGate {
  id: string;
  z: number;
  prompt: string;
  options: [ShootOption, ShootOption, ShootOption];
  /** World-x, world-y for each option — scattered like a shooting gallery,
   *  not a neat row of three doors (that's SQL Quest's identity; this game
   *  is "bugs swarming at different heights," not "pick a lane"). */
  positions: [[number, number], [number, number], [number, number]];
}

// Python Forest / World 1 opening — variables, print, and data types,
// phrased as things to shoot rather than questions to stop and answer.
export const PYTHON_FOREST_GATES: ShootGate[] = [
  {
    id: 'g1',
    z: 26,
    prompt: 'Shoot the bug that correctly prints Hello, World!',
    options: [
      { text: 'print(Hello, World!)', correct: false },
      { text: 'print("Hello, World!")', correct: true },
      { text: 'echo "Hello, World!"', correct: false },
    ],
    positions: [
      [-1.5, 2.3],
      [0.4, 1.3],
      [1.7, 2.7],
    ],
  },
  {
    id: 'g2',
    z: 48,
    prompt: 'x = 5. Shoot the bug with the correct data type of x.',
    options: [
      { text: 'str', correct: false },
      { text: 'int', correct: true },
      { text: 'bool', correct: false },
    ],
    positions: [
      [1.6, 1.4],
      [-0.6, 2.6],
      [-1.8, 1.6],
    ],
  },
  {
    id: 'g3',
    z: 70,
    prompt: 'Shoot the bug that correctly assigns 10 to a variable name.',
    options: [
      { text: 'name == 10', correct: false },
      { text: '10 = name', correct: false },
      { text: 'name = 10', correct: true },
    ],
    positions: [
      [-1.4, 1.5],
      [1.5, 2.5],
      [0.1, 2.0],
    ],
  },
  {
    id: 'g4',
    z: 92,
    prompt: 'What does print(2 + 3) output? Shoot that bug.',
    options: [
      { text: '23', correct: false },
      { text: '5', correct: true },
      { text: 'Error', correct: false },
    ],
    positions: [
      [1.3, 1.3],
      [-1.0, 2.8],
      [0.5, 1.8],
    ],
  },
];

export const LEVEL_END_Z = 112;
