// Each gate is a "shoot the correct answer" moment: three bugs appear
// ahead, one per lane. The student strafes the character into a lane
// (visibly moving, not just toggling an invisible selection) and fires —
// hitting the correct lane keeps the run going with a boost; missing
// just costs a brief stumble and some energy, never a stop. Real
// code-writing stays in the separate lab overlay — this mode is for fast
// concept checks only.

export const LANE_X = [-1.6, 0, 1.6] as const; // left, mid, right — same lanes the avatar strafes into
const TARGET_Y = 1.6; // fixed height so aiming is purely left/right, never ambiguous

export interface ShootOption {
  text: string;
  correct: boolean;
}

export interface ShootGate {
  id: string;
  z: number;
  prompt: string;
  options: [ShootOption, ShootOption, ShootOption];
}

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
  },
];

export function laneXOf(index: 0 | 1 | 2): number {
  return LANE_X[index];
}
export const TARGET_FIXED_Y = TARGET_Y;
export const LEVEL_END_Z = 112;
