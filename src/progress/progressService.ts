// Save/resume for a student's progress through the curriculum. There is
// no backend yet (Supabase accounts/sync are explicitly Prompt 7), so for
// now this persists to localStorage on the student's own device/browser —
// real save/resume across a reload, but not yet across devices or
// accounts. That limitation is disclosed in the README, not hidden.

import { WORLDS, getWorld, type LevelDef, type WorldDef } from '../curriculum/worlds';

export type LevelStatus = 'locked' | 'unlocked' | 'in_progress' | 'completed' | 'coming_soon';
export type PathwayChoice = 'cs' | 'ip';

interface ProgressState {
  pathway: PathwayChoice;
  startedLevelIds: string[];
  completedLevelIds: string[];
  totalXp: number;
  totalCoins: number;
}

const STORAGE_KEY = 'python-legends:progress:v1';

function defaultState(): ProgressState {
  return { pathway: 'cs', startedLevelIds: [], completedLevelIds: [], totalXp: 0, totalCoins: 0 };
}

function loadState(): ProgressState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    // Defensive merge so a future field addition doesn't crash on old saves.
    return { ...defaultState(), ...parsed };
  } catch {
    // Private browsing, storage disabled, or corrupt JSON — fall back to a
    // fresh in-memory-only state rather than crashing the app.
    return defaultState();
  }
}

function saveState(state: ProgressState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Best-effort only; progress just won't persist this session.
  }
}

let state = loadState();
type Listener = () => void;
const listeners = new Set<Listener>();
function notify() {
  listeners.forEach((l) => l());
}

export const progressService = {
  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  getPathway(): PathwayChoice {
    return state.pathway;
  },

  setPathway(pathway: PathwayChoice) {
    state = { ...state, pathway };
    saveState(state);
    notify();
  },

  getTotalXp(): number {
    return state.totalXp;
  },

  getTotalCoins(): number {
    return state.totalCoins;
  },

  markStarted(levelId: string) {
    if (state.startedLevelIds.includes(levelId)) return;
    state = { ...state, startedLevelIds: [...state.startedLevelIds, levelId] };
    saveState(state);
    notify();
  },

  isCompleted(levelId: string): boolean {
    return state.completedLevelIds.includes(levelId);
  },

  completeLevel(levelId: string, rewardXp: number, rewardCoins: number) {
    if (state.completedLevelIds.includes(levelId)) return;
    state = {
      ...state,
      completedLevelIds: [...state.completedLevelIds, levelId],
      totalXp: state.totalXp + rewardXp,
      totalCoins: state.totalCoins + rewardCoins,
    };
    saveState(state);
    notify();
  },

  /** Locked / unlocked / in-progress / completed / coming-soon for one level. */
  getLevelStatus(level: LevelDef): LevelStatus {
    const world = getWorld(level.worldId);
    if (!world?.implemented || !level.implemented) return 'coming_soon';
    if (state.completedLevelIds.includes(level.id)) return 'completed';
    if (level.localNumber === 1) {
      return state.startedLevelIds.includes(level.id) ? 'in_progress' : 'unlocked';
    }
    const previous = world.levels.find((l) => l.localNumber === level.localNumber - 1);
    const previousDone = previous ? state.completedLevelIds.includes(previous.id) : true;
    if (!previousDone) return 'locked';
    return state.startedLevelIds.includes(level.id) ? 'in_progress' : 'unlocked';
  },

  /** A world is playable once it has real content; within that, progress
   *  is still level-by-level (see getLevelStatus). */
  isWorldPlayable(world: WorldDef): boolean {
    return world.implemented;
  },

  getWorldProgress(world: WorldDef): { completed: number; total: number } {
    const total = world.levels.length;
    const completed = world.levels.filter((l) => state.completedLevelIds.includes(l.id)).length;
    return { completed, total };
  },

  getOverallProgress(): { completed: number; total: number } {
    const total = WORLDS.reduce((sum, w) => sum + w.levels.length, 0);
    const completed = state.completedLevelIds.length;
    return { completed, total };
  },

  /** Where to resume: the first unlocked-or-in-progress level, else null
   *  if everything implemented so far is completed. */
  getResumeLevel(): LevelDef | null {
    for (const world of WORLDS) {
      if (!world.implemented) continue;
      for (const level of world.levels) {
        const status = progressService.getLevelStatus(level);
        if (status === 'unlocked' || status === 'in_progress') return level;
      }
    }
    return null;
  },
};
