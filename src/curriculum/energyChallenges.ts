// Side-objective "energy conduit" challenges used only inside World 1,
// Level 1's hurdle/chase sequence. These are deliberately separate from
// WORLD_1_MISSIONS: they don't have their own curriculum LevelDef, aren't
// tracked in progressService as a completed level, and exist purely to
// give the player a real reason (energy, to get past the gate) to solve
// real Python under light time pressure from the Guardian.
//
// Reuses the same shape the Mission interface needs (story, starterCode,
// check, rewardXp/rewardCoins) so PythonLabOverlay can render them with no
// changes, plus one extra field (rewardEnergy) the overlay ignores and
// GameScene reads directly.

import { linesOf } from './missions';
import type { Mission } from './missions';

export interface EnergyChallenge extends Mission {
  rewardEnergy: number;
}

export const ENERGY_CHALLENGES: EnergyChallenge[] = [
  {
    id: 'w1-l1-conduit-0',
    title: 'Energy Conduit — East',
    topic: 'Quick math in Python',
    story:
      'This conduit only responds to a correct calculation. Python can do arithmetic right inside print(): ' +
      'print(6 * 7) would print 42. Make this conduit print exactly: 42',
    starterCode: '# Print exactly: 42\n# (it has to come from a calculation Python does — not just print("42"))\n\n',
    check(stdout, code) {
      const lines = linesOf(stdout);
      if (!lines.includes('42')) {
        return 'The conduit stayed dark — it needs to print exactly: 42';
      }
      if (!/[*+\-/]/.test(code.replace(/#.*$/gm, ''))) {
        return 'The conduit wants to see an actual calculation (like 6 * 7), not just the number typed directly.';
      }
      return null;
    },
    rewardXp: 10,
    rewardCoins: 2,
    rewardEnergy: 50,
  },
  {
    id: 'w1-l1-conduit-1',
    title: 'Energy Conduit — West',
    topic: 'Loops: counting up',
    story:
      'This conduit charges from a counting sequence. A for loop with range() repeats code a fixed number of ' +
      'times — for example: for i in range(3): print(i) counts 0, 1, 2. Make this conduit count UP from 1 to 3 ' +
      '(three separate lines: 1, then 2, then 3) using a loop.',
    starterCode:
      '# Use a for loop with range() to print, on three separate lines:\n#   1\n#   2\n#   3\n\n',
    check(stdout, code) {
      const lines = linesOf(stdout);
      if (lines[0] !== '1' || lines[1] !== '2' || lines[2] !== '3') {
        return 'The conduit expected exactly three lines: 1, then 2, then 3.';
      }
      if (!/\bfor\b/.test(code.replace(/#.*$/gm, ''))) {
        return 'The conduit wants to see an actual for loop doing the counting, not three separate print() calls.';
      }
      return null;
    },
    rewardXp: 10,
    rewardCoins: 2,
    rewardEnergy: 50,
  },
];
