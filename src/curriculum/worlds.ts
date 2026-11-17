// The curriculum map from the Python Legends build brief (section 4),
// stored as structured data rather than hard-coded into scene/game logic,
// per the brief's architecture principles. This is the full 5-world,
// 25-level topic progression.
//
// `pathway` distinguishes CBSE Computer Science (CS) vs Informatics
// Practices (IP) content. Right now every level here is `'common'` —
// these are shared Python-fundamentals topics that both the CS (083) and
// IP (065) class 11 syllabi cover in essentially the same way. The data
// model supports `'cs'`-only and `'ip'`-only levels for when the two
// pathways diverge (this happens later in the full syllabus — e.g. IP's
// heavier pandas/data-handling track vs CS's deeper algorithms/file
// -structure track), but no such divergent level has been added yet, and
// this map has not been independently re-verified against the current
// official CBSE syllabus documents for this academic year. Treat it as a
// reasonable starting point, not a final, syllabus-audited source — the
// brief itself says to verify before publishing.
//
// `implemented` is honest bookkeeping: only World 1 has real, playable
// content right now. Worlds 2-5 exist here as labelled topic data so the
// map/level system can show the whole curriculum, but they are NOT
// playable yet — the UI must show them as "coming soon", never as empty
// playable levels pretending to be real.

export type Pathway = 'common' | 'cs' | 'ip';

export interface LevelDef {
  /** Stable id, e.g. "w1-l2". */
  id: string;
  worldId: string;
  /** Level number within its world (1-based). */
  localNumber: number;
  /** Level number across the whole curriculum (1-25). */
  globalNumber: number;
  topic: string;
  pathway: Pathway;
  /** True once a real mission/content exists for this level. */
  implemented: boolean;
  /** Id into the mission registry, once implemented. */
  missionId?: string;
}

export interface WorldDef {
  id: string;
  name: string;
  tagline: string;
  difficulty: string;
  /** The boss encounter at the end of this world (built once the world's
   *  real content is). Name only until the world itself is implemented. */
  bossName: string;
  /** True once this world has a real explorable 3D scene. */
  implemented: boolean;
  levels: LevelDef[];
}

export const WORLDS: WorldDef[] = [
  {
    id: 'world-1',
    name: 'Python Forest',
    tagline: 'Where every Python Legend begins.',
    difficulty: 'Beginner',
    bossName: 'The Variable Monster',
    implemented: true,
    levels: [
      { id: 'w1-l1', worldId: 'world-1', localNumber: 1, globalNumber: 1, topic: 'Introduction to Python', pathway: 'common', implemented: true, missionId: 'w1-l1' },
      { id: 'w1-l2', worldId: 'world-1', localNumber: 2, globalNumber: 2, topic: 'print() statement', pathway: 'common', implemented: true, missionId: 'w1-l2' },
      { id: 'w1-l3', worldId: 'world-1', localNumber: 3, globalNumber: 3, topic: 'Comments and syntax', pathway: 'common', implemented: true, missionId: 'w1-l3' },
      { id: 'w1-l4', worldId: 'world-1', localNumber: 4, globalNumber: 4, topic: 'Variables and identifiers', pathway: 'common', implemented: true, missionId: 'w1-l4' },
      { id: 'w1-l5', worldId: 'world-1', localNumber: 5, globalNumber: 5, topic: 'Data types', pathway: 'common', implemented: true, missionId: 'w1-l5' },
      { id: 'w1-l6', worldId: 'world-1', localNumber: 6, globalNumber: 6, topic: 'input() statement', pathway: 'common', implemented: true, missionId: 'w1-l6' },
      { id: 'w1-l7', worldId: 'world-1', localNumber: 7, globalNumber: 7, topic: 'Type conversion', pathway: 'common', implemented: true, missionId: 'w1-l7' },
      // Named in the brief's Python Forest topic list (Variables, Data
      // types, Operators, Input/output) but no real mission exists yet —
      // honest "coming soon" data, not a fake playable level.
      { id: 'w1-l8', worldId: 'world-1', localNumber: 8, globalNumber: 8, topic: 'Operators', pathway: 'common', implemented: false },
    ],
  },
  {
    id: 'world-2',
    name: 'Loop Kingdom',
    tagline: 'Master the loops that repeat your way to victory.',
    difficulty: 'Foundation',
    bossName: 'The Infinite Loop Dragon',
    implemented: true,
    levels: [
      { id: 'w2-l1', worldId: 'world-2', localNumber: 1, globalNumber: 9, topic: 'for loops', pathway: 'common', implemented: true, missionId: 'w2-l1' },
      { id: 'w2-l2', worldId: 'world-2', localNumber: 2, globalNumber: 10, topic: 'while loops', pathway: 'common', implemented: true, missionId: 'w2-l2' },
      { id: 'w2-l3', worldId: 'world-2', localNumber: 3, globalNumber: 11, topic: 'Nested loops', pathway: 'common', implemented: true, missionId: 'w2-l3' },
      { id: 'w2-l4', worldId: 'world-2', localNumber: 4, globalNumber: 12, topic: 'range() function', pathway: 'common', implemented: true, missionId: 'w2-l4' },
    ],
  },
  {
    id: 'world-3',
    name: 'Function Castle',
    tagline: 'Command functions, parameters, and the values they return.',
    difficulty: 'Intermediate',
    bossName: 'The Return Wizard',
    implemented: false,
    levels: [
      { id: 'w3-l1', worldId: 'world-3', localNumber: 1, globalNumber: 13, topic: 'Functions', pathway: 'common', implemented: false },
      { id: 'w3-l2', worldId: 'world-3', localNumber: 2, globalNumber: 14, topic: 'Parameters', pathway: 'common', implemented: false },
      { id: 'w3-l3', worldId: 'world-3', localNumber: 3, globalNumber: 15, topic: 'Arguments', pathway: 'common', implemented: false },
      { id: 'w3-l4', worldId: 'world-3', localNumber: 4, globalNumber: 16, topic: 'Return statements', pathway: 'common', implemented: false },
    ],
  },
  {
    id: 'world-4',
    name: 'Data Structure City',
    tagline: 'Collect, organise, and wield every Python data structure.',
    difficulty: 'Advanced',
    bossName: 'The Data Destroyer',
    implemented: false,
    levels: [
      { id: 'w4-l1', worldId: 'world-4', localNumber: 1, globalNumber: 17, topic: 'Lists', pathway: 'common', implemented: false },
      { id: 'w4-l2', worldId: 'world-4', localNumber: 2, globalNumber: 18, topic: 'Tuples', pathway: 'common', implemented: false },
      { id: 'w4-l3', worldId: 'world-4', localNumber: 3, globalNumber: 19, topic: 'Dictionaries', pathway: 'common', implemented: false },
      { id: 'w4-l4', worldId: 'world-4', localNumber: 4, globalNumber: 20, topic: 'Sets', pathway: 'common', implemented: false },
      { id: 'w4-l5', worldId: 'world-4', localNumber: 5, globalNumber: 21, topic: 'String operations', pathway: 'common', implemented: false },
    ],
  },
  {
    id: 'world-5',
    name: 'The Coding Battle',
    tagline: 'The final trial: debug, predict, and out-think every bug.',
    difficulty: 'Master',
    bossName: 'The Master Debugger',
    implemented: false,
    levels: [
      { id: 'w5-l1', worldId: 'world-5', localNumber: 1, globalNumber: 22, topic: 'Debugging', pathway: 'common', implemented: false },
      { id: 'w5-l2', worldId: 'world-5', localNumber: 2, globalNumber: 23, topic: 'Output prediction', pathway: 'common', implemented: false },
      { id: 'w5-l3', worldId: 'world-5', localNumber: 3, globalNumber: 24, topic: 'Code completion', pathway: 'common', implemented: false },
      { id: 'w5-l4', worldId: 'world-5', localNumber: 4, globalNumber: 25, topic: 'Logical programming challenges', pathway: 'common', implemented: false },
    ],
  },
];

export function getWorld(worldId: string): WorldDef | undefined {
  return WORLDS.find((w) => w.id === worldId);
}

export function getLevel(levelId: string): LevelDef | undefined {
  for (const world of WORLDS) {
    const level = world.levels.find((l) => l.id === levelId);
    if (level) return level;
  }
  return undefined;
}

export function getAllLevelsFlat(): LevelDef[] {
  return WORLDS.flatMap((w) => w.levels);
}

/**
 * The next level after this one, in the same world, if it's implemented
 * and playable — used to chain levels together in one continuous 3D
 * session instead of forcing a trip back to the World Map after every
 * single level. Returns undefined at the end of a world (or if the next
 * level isn't built yet), which is exactly when going back to the map
 * makes sense — e.g. to pick a different pathway/world.
 */
export function getNextPlayableLevel(levelId: string): LevelDef | undefined {
  const world = WORLDS.find((w) => w.levels.some((l) => l.id === levelId));
  if (!world) return undefined;
  const idx = world.levels.findIndex((l) => l.id === levelId);
  const next = world.levels[idx + 1];
  return next && next.implemented && next.missionId ? next : undefined;
}
