// The World-1 "Python Forest" continuous track: a straight line along X
// that the player auto-runs down. Every real mission from
// `src/curriculum/missions.ts` becomes a "gate" along the track — a
// glowing portal that stops the auto-run and opens the exact same
// PythonLabOverlay/Pyodide-checked challenge as before. Nothing about the
// mission content, checking logic, or Pyodide execution changes; only how
// the player *travels between* challenges changes (continuous run instead
// of free-roam walk-to-a-terminal).

export interface TrackObstacle {
  id: string;
  x: number;
  /** 'low' = a box you must jump over. 'high' = an overhead bar you must
   *  slide under. */
  kind: 'low' | 'high';
}

export interface TrackCollectible {
  id: string;
  x: number;
  y: number;
  kind: 'coin' | 'shield' | 'boost';
}

export interface TrackGate {
  id: string;
  x: number;
  /** The real mission id (matches the level id — see missions.ts). */
  missionId: string;
  levelId: string;
  label: string;
}

export const GATE_SPACING = 46;
export const TRACK_START_X = 10;

/** The 7 real, implemented World-1 missions, in curriculum order. */
const MISSION_ORDER = ['w1-l1', 'w1-l2', 'w1-l3', 'w1-l4', 'w1-l5', 'w1-l6', 'w1-l7'];

export const GATES: TrackGate[] = MISSION_ORDER.map((levelId, i) => ({
  id: `gate-${levelId}`,
  x: TRACK_START_X + GATE_SPACING * (i + 1),
  missionId: levelId,
  levelId,
  label: `Level ${i + 1}`,
}));

export const BOSS_ARENA_X = GATES[GATES.length - 1].x + 40;
export const TRACK_END_X = BOSS_ARENA_X + 34;

export const OBSTACLES: TrackObstacle[] = [];
export const COLLECTIBLES: TrackCollectible[] = [];

GATES.forEach((gate, i) => {
  const sectionStart = i === 0 ? TRACK_START_X : GATES[i - 1].x;
  const usable = gate.x - sectionStart - 10; // keep clear space right before the gate
  const flip = i % 2 === 0;

  OBSTACLES.push({ id: `obs-${i}-a`, x: sectionStart + usable * 0.32, kind: flip ? 'low' : 'high' });
  OBSTACLES.push({ id: `obs-${i}-b`, x: sectionStart + usable * 0.64, kind: flip ? 'high' : 'low' });

  for (let c = 0; c < 4; c++) {
    COLLECTIBLES.push({ id: `coin-${i}-${c}`, x: sectionStart + 6 + c * 4, y: 1.1, kind: 'coin' });
  }
  COLLECTIBLES.push({ id: `power-${i}`, x: sectionStart + usable * 0.48, y: 1.5, kind: i % 2 === 0 ? 'shield' : 'boost' });
});

/** Where to start the run: just past the last gate the student has
 *  already cleared (per progressService), so leaving and coming back
 *  resumes instead of re-running the whole track from zero. */
export function startXForCompletedLevels(completedLevelIds: string[]): number {
  let furthest = TRACK_START_X;
  for (const gate of GATES) {
    if (completedLevelIds.includes(gate.levelId)) furthest = gate.x + 2;
  }
  return furthest;
}
