// The Variable Monster boss fight: three quick predict-the-output hits.
// Each correct answer lands a hit on the monster; a wrong answer costs
// the player energy and the same question stays up to retry (per the
// brief: "incorrect answers trigger an explanation and an opportunity to
// retry") rather than ending the fight. Reuses the same multiple-choice
// shape as a mission's `predict` question — no new content format.

export interface BossHit {
  prompt: string;
  snippet: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export const BOSS_NAME = 'The Variable Monster';

export const BOSS_CHALLENGES: BossHit[] = [
  {
    prompt: 'The Variable Monster swaps names to confuse you. What does this actually print?',
    snippet: 'health = 10\nhealth = 25\nprint(health)',
    options: ['10', '25', '"health"', 'An error'],
    correctIndex: 1,
    explanation: 'A variable holds whatever it was most recently assigned — reassigning health to 25 overwrites the 10.',
  },
  {
    prompt: 'The monster tries a decoy. What prints here?',
    snippet: 'power = 5\nenergy = power\npower = 99\nprint(energy)',
    options: ['99', '5', 'None', 'An error'],
    correctIndex: 1,
    explanation: 'energy copied the value of power (5) at that moment — later changing power does not change energy too.',
  },
  {
    prompt: 'One last trick. What does this print?',
    snippet: 'score = 3\nscore = score + 1\nprint(score)',
    options: ['3', '4', 'score + 1', 'An error'],
    correctIndex: 1,
    explanation: 'The right side (score + 1) is evaluated first using the old value, then stored back into score.',
  },
];
