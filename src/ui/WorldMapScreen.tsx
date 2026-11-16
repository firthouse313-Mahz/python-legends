import { useState, useSyncExternalStore } from 'react';
import { WORLDS, type LevelDef, type WorldDef } from '../curriculum/worlds';
import { progressService, type LevelStatus, type PathwayChoice } from '../progress/progressService';
import './world-map.css';

interface Props {
  onPlayLevel: (level: LevelDef) => void;
}

const STATUS_LABEL: Record<LevelStatus, string> = {
  locked: 'Locked',
  unlocked: 'Start',
  in_progress: 'Continue',
  completed: 'Completed',
  coming_soon: 'Coming soon',
};

function LevelCard({ level, status, onPlay }: { level: LevelDef; status: LevelStatus; onPlay: () => void }) {
  const playable = status === 'unlocked' || status === 'in_progress' || status === 'completed';
  return (
    <button
      className={`level-card level-${status}`}
      disabled={!playable}
      onClick={onPlay}
      aria-label={`Level ${level.globalNumber}: ${level.topic} — ${STATUS_LABEL[status]}`}
    >
      <div className="level-card-top">
        <span className="level-number">{level.globalNumber}</span>
        <span className={`level-badge level-badge-${status}`}>
          {status === 'completed' && '✓'}
          {status === 'locked' && '🔒'}
          {status === 'coming_soon' && '…'}
          {status === 'in_progress' && '▶'}
          {status === 'unlocked' && '★'}
        </span>
      </div>
      <div className="level-topic">{level.topic}</div>
      <div className="level-action">{STATUS_LABEL[status]}</div>
    </button>
  );
}

function WorldCard({
  world,
  expanded,
  onToggle,
  onPlayLevel,
}: {
  world: WorldDef;
  expanded: boolean;
  onToggle: () => void;
  onPlayLevel: (level: LevelDef) => void;
}) {
  const { completed, total } = progressService.getWorldProgress(world);
  return (
    <div className={`world-card ${world.implemented ? '' : 'world-not-implemented'}`}>
      <button className="world-card-header" onClick={onToggle} aria-expanded={expanded}>
        <div>
          <div className="world-name">
            {world.name}
            {!world.implemented && <span className="world-soon-tag">Coming soon</span>}
          </div>
          <div className="world-tagline">{world.tagline}</div>
        </div>
        <div className="world-meta">
          <span className="world-difficulty">{world.difficulty}</span>
          <span className="world-progress">
            {world.implemented ? `${completed}/${total} levels` : `${total} levels planned`}
          </span>
          <span className={`world-chevron ${expanded ? 'open' : ''}`}>▾</span>
        </div>
      </button>
      {expanded && (
        <div className="level-grid">
          {world.levels.map((level) => (
            <LevelCard
              key={level.id}
              level={level}
              status={progressService.getLevelStatus(level)}
              onPlay={() => onPlayLevel(level)}
            />
          ))}
        </div>
      )}
      {expanded && !world.implemented && (
        <p className="world-not-built-note">
          This world hasn't been built yet — the levels above show the planned topics only. Finish
          Python Village to see it unlock here as development continues.
        </p>
      )}
    </div>
  );
}

export function WorldMapScreen({ onPlayLevel }: Props) {
  const [expandedWorldId, setExpandedWorldId] = useState<string>('world-1');
  const pathway = useSyncExternalStore(
    (cb) => progressService.subscribe(cb),
    () => progressService.getPathway(),
  );
  const totalXp = useSyncExternalStore(
    (cb) => progressService.subscribe(cb),
    () => progressService.getTotalXp(),
  );
  const totalCoins = useSyncExternalStore(
    (cb) => progressService.subscribe(cb),
    () => progressService.getTotalCoins(),
  );
  // getOverallProgress() also allocates a fresh object each call, but it's
  // only read here as a plain value during render (not as a useSyncExternalStore
  // snapshot), so a new reference each render is harmless — it doesn't feed
  // back into a subscription's getSnapshot identity check.
  const overall = progressService.getOverallProgress();

  function setPathway(p: PathwayChoice) {
    progressService.setPathway(p);
  }

  return (
    <div className="world-map-screen">
      <header className="world-map-header">
        <div>
          <h1>Digi Class · Python Legends</h1>
          <p className="world-map-subtitle">
            {overall.completed}/{overall.total} levels complete across the full curriculum ·{' '}
            {totalXp} XP · {totalCoins} coins
          </p>
        </div>
        <div className="pathway-toggle" role="group" aria-label="Choose your syllabus pathway">
          <button className={pathway === 'cs' ? 'active' : ''} onClick={() => setPathway('cs')}>
            CS pathway
          </button>
          <button className={pathway === 'ip' ? 'active' : ''} onClick={() => setPathway('ip')}>
            IP pathway
          </button>
        </div>
      </header>
      <p className="pathway-note">
        Every level shown right now is shared between the Computer Science and Informatics Practices
        syllabi — this toggle is here for when the two pathways' content diverges later in the
        curriculum, and doesn't change anything yet.
      </p>

      <div className="world-list">
        {WORLDS.map((world) => (
          <WorldCard
            key={world.id}
            world={world}
            expanded={expandedWorldId === world.id}
            onToggle={() => setExpandedWorldId((cur) => (cur === world.id ? '' : world.id))}
            onPlayLevel={onPlayLevel}
          />
        ))}
      </div>
    </div>
  );
}
