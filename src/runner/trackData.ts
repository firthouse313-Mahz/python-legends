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
   *  slide under. The required dodge (jump vs. slide) never changes —
   *  only the look, via `variant`. */
  kind: 'low' | 'high';
  /** Plain box/bar by default. 'fire' is the same dodge, rendered as a
   *  fireball the chaser just behind you hurls forward — introduced from
   *  level 3 onward so later levels read as more dangerous, not just
   *  busier. */
  variant?: 'fire';
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

    // Difficulty ramps with the level number: levels 1-2 get the original
    // two obstacles; 3-5 get three, spaced tighter; 6+ get four, tighter
    // still — later levels are a genuinely busier run, not just a harder
    // coding question at the end of the same empty stretch.
    const count = i < 2 ? 2 : i < 5 ? 3 : 4;
    // Fireball obstacles start appearing from level 3 (index 2) and get
    // more common after that, as a second hazard look on top of the plain
    // box/bar — same jump/slide dodge, just a visibly more dangerous world.
    const fireChance = i < 2 ? 0 : Math.min(0.6, 0.2 * (i - 1));
    let flip = i % 2 === 0;
    let seed = i * 7 + 1;
    const nextRandom = () => {
      // Small deterministic PRNG (not Math.random()) so the same level
      // always builds the same track — important since startXForCompletedLevels
      // and hitIds/collectedIds persist across visits by obstacle id.
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return (seed % 1000) / 1000;
    };

    for (let n = 0; n < count; n++) {
      const t = (n + 1) / (count + 1); // evenly spaced within the section
      const kind: TrackObstacle['kind'] = flip ? 'low' : 'high';
      const variant: TrackObstacle['variant'] = nextRandom() < fireChance ? 'fire' : undefined;
      obstacles.push({ id: `obs-${i}-${n}`, x: sectionStart + usable * t, kind, variant });
      flip = !flip;
    }

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
