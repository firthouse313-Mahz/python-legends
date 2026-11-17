// A continuous track: a straight line along X that the player auto-runs
// down. Every real mission from `src/curriculum/missions.ts` becomes a
// "gate" along the track — a glowing portal that stops the auto-run and
// opens the exact same PythonLabOverlay/Pyodide-checked challenge as
// before. Nothing about the mission content, checking logic, or Pyodide
// execution changes; only how the player *travels between* challenges
// changes (continuous run instead of free-roam walk-to-a-terminal).
//
// Built per-world via `buildTrack(levelIds)` so every world's real
// missions get the same engine, not just World 1's.

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

export interface Track {
  gates: TrackGate[];
  obstacles: TrackObstacle[];
  collectibles: TrackCollectible[];
  bossArenaX: number;
  trackEndX: number;
}

export const GATE_SPACING = 46;
export const TRACK_START_X = 10;

/** Build a track from a world's implemented, in-order level ids. */
export function buildTrack(levelIds: string[]): Track {
  const gates: TrackGate[] = levelIds.map((levelId, i) => ({
    id: `gate-${levelId}`,
    x: TRACK_START_X + GATE_SPACING * (i + 1),
    missionId: levelId,
    levelId,
    label: `Level ${i + 1}`,
  }));

  const obstacles: TrackObstacle[] = [];
  const collectibles: TrackCollectible[] = [];

  gates.forEach((gate, i) => {
    const sectionStart = i === 0 ? TRACK_START_X : gates[i - 1].x;
    const usable = gate.x - sectionStart - 10; // keep clear space right before the gate
    const flip = i % 2 === 0;

    obstacles.push({ id: `obs-${i}-a`, x: sectionStart + usable * 0.32, kind: flip ? 'low' : 'high' });
    obstacles.push({ id: `obs-${i}-b`, x: sectionStart + usable * 0.64, kind: flip ? 'high' : 'low' });

    for (let c = 0; c < 4; c++) {
      collectibles.push({ id: `coin-${i}-${c}`, x: sectionStart + 6 + c * 4, y: 1.1, kind: 'coin' });
    }
    collectibles.push({ id: `power-${i}`, x: sectionStart + usable * 0.48, y: 1.5, kind: i % 2 === 0 ? 'shield' : 'boost' });
  });

  const bossArenaX = (gates[gates.length - 1]?.x ?? TRACK_START_X) + 40;
  const trackEndX = bossArenaX + 34;

  return { gates, obstacles, collectibles, bossArenaX, trackEndX };
}

/** Where to start the run: just past the last gate the student has
 *  already cleared (per progressService), so leaving and coming back
 *  resumes instead of re-running the whole track from zero. */
export function startXForCompletedLevels(gates: TrackGate[], completedLevelIds: string[]): number {
  let furthest = TRACK_START_X;
  for (const gate of gates) {
    if (completedLevelIds.includes(gate.levelId)) furthest = gate.x + 2;
  }
  return furthest;
}
