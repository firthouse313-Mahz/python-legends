// Boss fights: three quick predict-the-output hits per world. Each
// correct answer lands a hit; a wrong answer costs the player energy and
// the same question stays up to retry (per the brief: "incorrect answers
// trigger an explanation and an opportunity to retry") rather than ending
// the fight. Reuses the same multiple-choice shape as a mission's
// `predict` question — no new content format.

export interface BossHit {
  prompt: string;
  snippet: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface WorldBoss {
  name: string;
  hits: BossHit[];
}

export const BOSSES: Record<string, WorldBoss> = {
  'world-1': {
    name: 'The Variable Monster',
    hits: [
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
    ],
  },
  'world-2': {
    name: 'The Infinite Loop Dragon',
    hits: [
      {
        prompt: 'The dragon coils through a loop. How many times does this print "Roar"?',
        snippet: 'for i in range(4):\n    print("Roar")',
        options: ['3 times', '4 times', '5 times', 'Forever'],
        correctIndex: 1,
        explanation: 'range(4) produces 0, 1, 2, 3 — four values, so the loop body runs exactly 4 times.',
      },
      {
        prompt: 'The dragon tries to trap you in an infinite loop. What does this actually print?',
        snippet: 'n = 3\nwhile n > 0:\n    print(n)\n    n = n - 1',
        options: ['3 2 1', '3 2 1 0', 'Runs forever', '1 2 3'],
        correctIndex: 0,
        explanation: 'n decreases each pass and the loop stops as soon as n > 0 is false — it never prints 0, and it is not infinite because n shrinks every time.',
      },
      {
        prompt: 'One final coil — a loop inside a loop. What prints last?',
        snippet: 'for i in range(2):\n    for j in range(2):\n        print(i, j)',
        options: ['0 0', '1 1', '2 2', '1 0'],
        correctIndex: 1,
        explanation: 'The outer loop runs i=0,1; for each, the inner loop runs j=0,1 — the very last pair printed is i=1, j=1.',
      },
    ],
  },
};
