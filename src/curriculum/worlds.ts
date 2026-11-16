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
  /** True once this world has a real explorable 3D scene. */
  implemented: boolean;
  levels: LevelDef[];
}

export const WORLDS: WorldDef[] = [
  {
    id: 'world-1',
    name: 'Python Village',
    tagline: 'Where every Python Legend begins.',
    difficulty: 'Beginner',
    implemented: true,
    levels: [
      { id: 'w1-l1', worldId: 'world-1', localNumber: 1, globalNumber: 1, topic: 'Introduction to Python', pathway: 'common', implemented: true, missionId: 'w1-l1' },
      { id: 'w1-l2', worldId: 'world-1', localNumber: 2, globalNumber: 2, topic: 'print() statement', pathway: 'common', implemented: true, missionId: 'w1-l2' },
      { id: 'w1-l3', worldId: 'world-1', localNumber: 3, globalNumber: 3, topic: 'Comments and syntax', pathway: 'common', implemented: true, missionId: 'w1-l3' },
      { id: 'w1-l4', worldId: 'world-1', localNumber: 4, globalNumber: 4, topic: 'Variables and identifiers', pathway: 'common', implemented: true, missionId: 'w1-l4' },
      { id: 'w1-l5', worldId: 'world-1', localNumber: 5, globalNumber: 5, topic: 'Data types', pathway: 'common', implemented: true, missionId: 'w1-l5' },
      { id: 'w1-l6', worldId: 'world-1', localNumber: 6, globalNumber: 6, topic: 'input() statement', pathway: 'common', implemented: true, missionId: 'w1-l6' },
      { id: 'w1-l7', worldId: 'world-1', localNumber: 7, globalNumber: 7, topic: 'Type conversion', pathway: 'common', implemented: true, missionId: 'w1-l7' },
    ],
  },
  {
    id: 'world-2',
    name: 'Operator Kingdom',
    tagline: 'Master the operators that power every expression.',
    difficulty: 'Foundation',
    implemented: false,
    levels: [
      { id: 'w2-l1', worldId: 'world-2', localNumber: 1, globalNumber: 8, topic: 'Arithmetic operators', pathway: 'common', implemented: false },
      { id: 'w2-l2', worldId: 'world-2', localNumber: 2, globalNumber: 9, topic: 'Relational operators', pathway: 'common', implemented: false },
      { id: 'w2-l3', worldId: 'world-2', localNumber: 3, globalNumber: 10, topic: 'Logical operators', pathway: 'common', implemented: false },
      { id: 'w2-l4', worldId: 'world-2', localNumber: 4, globalNumber: 11, topic: 'Assignment and augmented assignment', pathway: 'common', implemented: false },
      { id: 'w2-l5', worldId: 'world-2', localNumber: 5, globalNumber: 12, topic: 'Expressions and operator precedence', pathway: 'common', implemented: false },
    ],
  },
  {
    id: 'world-3',
    name: 'Logic Forest',
    tagline: 'Branch, loop, and bend the flow of your programs.',
    difficulty: 'Intermediate',
    implemented: false,
    levels: [
      { id: 'w3-l1', worldId: 'world-3', localNumber: 1, globalNumber: 13, topic: 'if statement', pathway: 'common', implemented: false },
      { id: 'w3-l2', worldId: 'world-3', localNumber: 2, globalNumber: 14, topic: 'if–else', pathway: 'common', implemented: false },
      { id: 'w3-l3', worldId: 'world-3', localNumber: 3, globalNumber: 15, topic: 'if–elif–else', pathway: 'common', implemented: false },
      { id: 'w3-l4', worldId: 'world-3', localNumber: 4, globalNumber: 16, topic: 'Nested conditions', pathway: 'common', implemented: false },
      { id: 'w3-l5', worldId: 'world-3', localNumber: 5, globalNumber: 17, topic: 'for loop', pathway: 'common', implemented: false },
      { id: 'w3-l6', worldId: 'world-3', localNumber: 6, globalNumber: 18, topic: 'while loop', pathway: 'common', implemented: false },
      { id: 'w3-l7', worldId: 'world-3', localNumber: 7, globalNumber: 19, topic: 'break, continue and pass', pathway: 'common', implemented: false },
    ],
  },
  {
    id: 'world-4',
    name: 'Data Dungeon',
    tagline: 'Collect, organise, and wield Python’s data structures.',
    difficulty: 'Advanced',
    implemented: false,
    levels: [
      { id: 'w4-l1', worldId: 'world-4', localNumber: 1, globalNumber: 20, topic: 'Strings and string operations', pathway: 'common', implemented: false },
      { id: 'w4-l2', worldId: 'world-4', localNumber: 2, globalNumber: 21, topic: 'Lists', pathway: 'common', implemented: false },
      { id: 'w4-l3', worldId: 'world-4', localNumber: 3, globalNumber: 22, topic: 'Tuples', pathway: 'common', implemented: false },
      { id: 'w4-l4', worldId: 'world-4', localNumber: 4, globalNumber: 23, topic: 'Dictionaries', pathway: 'common', implemented: false },
      { id: 'w4-l5', worldId: 'world-4', localNumber: 5, globalNumber: 24, topic: 'Functions and modules', pathway: 'common', implemented: false },
    ],
  },
  {
    id: 'world-5',
    name: 'Python Empire',
    tagline: 'The final trial: handle files and failures like a master.',
    difficulty: 'Master',
    implemented: false,
    levels: [
      { id: 'w5-l1', worldId: 'world-5', localNumber: 1, globalNumber: 25, topic: 'File handling and exception handling', pathway: 'common', implemented: false },
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
