import { useState, useSyncExternalStore } from 'react';
import { WORLDS, type LevelDef, type WorldDef } from '../curriculum/worlds';
import { progressService, type LevelStatus, type PathwayChoice } from '../progress/progressService';
import { visualFor } from './worldMapTheme';
import { Mascot } from './Mascot';
import { Emblem } from './Emblem';
import type { AccountIdentity } from '../account/accountService';
import './world-map.css';

interface Props {
  onPlayLevel: (level: LevelDef) => void;
  identity: AccountIdentity | null;
  onLogOut: () => void;
  muted: boolean;
  onToggleMute: () => void;
}

type View = 'explore' | 'progress' | 'settings';

const STATUS_LABEL: Record<LevelStatus, string> = {
  locked: 'Locked',
  unlocked: 'Start',
  in_progress: 'Continue',
  completed: 'Completed',
  coming_soon: 'Coming soon',
};

const WORLD_STATUS_LABEL: Record<'completed' | 'in_progress' | 'not_started' | 'coming_soon', string> = {
  completed: 'Completed',
  in_progress: 'In progress',
  not_started: 'Start here',
  coming_soon: 'Coming soon',
};

function worldStatusOf(world: WorldDef, completed: number, total: number): keyof typeof WORLD_STATUS_LABEL {
  if (!world.implemented) return 'coming_soon';
  if (completed >= total && total > 0) return 'completed';
  if (completed > 0) return 'in_progress';
  return 'not_started';
}

/** A level that isn't worth a real age to Python yet — same derivation as
 *  the old "Lv." badge the brief's reference shows, purely a display of
 *  existing totalXp (100 XP per level), never stored anywhere new. */
function levelFromXp(xp: number) {
  return 1 + Math.floor(xp / 100);
}

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

/** A planned-but-unbuilt topic, shown honestly as a locked mission rather
 *  than an empty or fake-playable card. */
function LockedMissionChip({ level }: { level: LevelDef }) {
  return (
    <div className="locked-mission-chip" aria-label={`${level.topic} — coming soon`}>
      <span className="locked-mission-icon">🔒</span>
      <span className="locked-mission-num">#{level.globalNumber}</span>
      <span className="locked-mission-topic">{level.topic}</span>
      <span className="locked-mission-tag">Coming soon</span>
    </div>
  );
}

function WorldBanner({
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
  const visual = visualFor(world.id);
  const status = worldStatusOf(world, completed, total);
  const pct = total ? Math.round((completed / total) * 100) : 0;

  return (
    <div
      className={`world-banner world-status-${status}`}
      style={
        {
          '--world-accent': visual.accent,
          '--world-accent-2': visual.accent2,
          '--world-accent-soft': visual.accentSoft,
          '--world-accent-2-soft': visual.accent2Soft,
          '--world-glow': visual.glow,
        } as React.CSSProperties
      }
    >
      <button className="world-banner-header" onClick={onToggle} aria-expanded={expanded}>
        <span className="world-emblem">
          <visual.Icon className="world-emblem-icon" />
        </span>
        <span className="world-banner-text">
          <span className="world-banner-name">
            {world.name}
            <span className={`world-status-pill world-status-pill-${status}`}>{WORLD_STATUS_LABEL[status]}</span>
          </span>
          <span className="world-banner-tagline">{world.tagline}</span>
        </span>
        <span className="world-banner-meta">
          <span className="world-banner-progress-label">
            {world.implemented ? `${completed}/${total} levels` : `${total} levels planned`}
          </span>
          {world.implemented && (
            <span className="world-progress-track">
              <span className="world-progress-fill" style={{ width: `${pct}%` }} />
            </span>
          )}
          <span className={`world-chevron ${expanded ? 'open' : ''}`}>▾</span>
        </span>
      </button>

      {expanded && world.implemented && (
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
        <>
          <div className="locked-mission-grid">
            {world.levels.map((level) => (
              <LockedMissionChip key={level.id} level={level} />
            ))}
          </div>
          <p className="world-not-built-note">
            This world hasn't been built yet — the missions above show the planned topics only. Keep
            clearing earlier worlds to see it unlock as development continues.
          </p>
        </>
      )}
    </div>
  );
}

function ProgressPanel() {
  const overall = progressService.getOverallProgress();
  return (
    <section className="wm-panel">
      <h2>My Progress</h2>
      <p className="wm-panel-sub">
        {overall.completed}/{overall.total} levels complete across the full curriculum.
      </p>
      <div className="progress-world-list">
        {WORLDS.map((world) => {
          const { completed, total } = progressService.getWorldProgress(world);
          const visual = visualFor(world.id);
          const pct = total ? Math.round((completed / total) * 100) : 0;
          return (
            <div key={world.id} className="progress-world-row" style={{ '--world-accent': visual.accent } as React.CSSProperties}>
              <span className="progress-world-name">{world.name}</span>
              <span className="world-progress-track">
                <span className="world-progress-fill" style={{ width: world.implemented ? `${pct}%` : '0%' }} />
              </span>
              <span className="progress-world-count">
                {world.implemented ? `${completed}/${total}` : 'Not built yet'}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function SettingsPanel({
  pathway,
  setPathway,
  identity,
  onLogOut,
  muted,
  onToggleMute,
}: {
  pathway: PathwayChoice;
  setPathway: (p: PathwayChoice) => void;
  identity: AccountIdentity | null;
  onLogOut: () => void;
  muted: boolean;
  onToggleMute: () => void;
}) {
  return (
    <section className="wm-panel">
      <h2>Settings</h2>

      {identity && (
        <div className="settings-row">
          <div>
            <div className="settings-row-label">Logged in as</div>
            <div className="settings-row-value">👤 {identity.name}</div>
          </div>
          <button className="settings-action settings-action-danger" onClick={onLogOut}>
            Log out
          </button>
        </div>
      )}

      <div className="settings-row">
        <div>
          <div className="settings-row-label">Sound</div>
          <div className="settings-row-value">{muted ? 'Muted' : 'On'}</div>
        </div>
        <button className="settings-action" onClick={onToggleMute}>
          {muted ? '🔇 Unmute' : '🔊 Mute'}
        </button>
      </div>

      <div className="settings-row settings-row-wrap">
        <div>
          <div className="settings-row-label">Syllabus pathway</div>
          <p className="wm-panel-sub" style={{ margin: '4px 0 0' }}>
            Every level shown right now is shared between the Computer Science and Informatics
            Practices syllabi — this is here for when the two pathways' content diverges later in
            the curriculum, and doesn't change anything yet.
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
      </div>
    </section>
  );
}

export function WorldMapScreen({ onPlayLevel, identity, onLogOut, muted, onToggleMute }: Props) {
  const [view, setView] = useState<View>('explore');
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

  function setPathway(p: PathwayChoice) {
    progressService.setPathway(p);
  }

  return (
    <div className="wm-shell">
      <aside className="wm-sidebar">
        <div className="wm-brand">
          <span className="wm-brand-eyebrow">DIGI CLASS</span>
          <h1 className="wm-brand-name"><Emblem size={22} /> Python Legends</h1>
        </div>
        <nav className="wm-nav">
          <button className={`wm-nav-item ${view === 'explore' ? 'active' : ''}`} onClick={() => setView('explore')}>
            <span className="wm-nav-icon">🧭</span> Explore
          </button>
          <button className={`wm-nav-item ${view === 'progress' ? 'active' : ''}`} onClick={() => setView('progress')}>
            <span className="wm-nav-icon">📊</span> My Progress
          </button>
          <button className="wm-nav-item wm-nav-item-disabled" disabled title="Coming soon">
            <span className="wm-nav-icon">🏆</span> Leaderboard <span className="wm-nav-soon">Soon</span>
          </button>
          <button className={`wm-nav-item ${view === 'settings' ? 'active' : ''}`} onClick={() => setView('settings')}>
            <span className="wm-nav-icon">⚙️</span> Settings
          </button>
          <button className="wm-nav-item wm-nav-item-disabled" disabled title="Coming soon">
            <span className="wm-nav-icon">❓</span> Help <span className="wm-nav-soon">Soon</span>
          </button>
        </nav>
        <div className="wm-mascot-wrap">
          <div className="wm-mascot-bubble">Learn it. Code it. Ace it.</div>
          <Mascot className="wm-mascot" />
        </div>
      </aside>

      <main className="wm-main">
        <header className="wm-topbar">
          <div className="wm-topbar-greeting">
            <span className="wm-crown">👑</span>
            <span>
              Where every <b>Python Legend</b> begins…
            </span>
          </div>
          <div className="wm-topbar-stats">
            <span className="wm-pill wm-pill-level">⭐ Lv.{levelFromXp(totalXp)}</span>
            <span className="wm-pill wm-pill-xp">⚡ {totalXp} XP</span>
            <span className="wm-pill wm-pill-coins">🪙 {totalCoins}</span>
            {identity && <span className="wm-avatar" title={identity.name}>{identity.name.slice(0, 1).toUpperCase()}</span>}
          </div>
        </header>

        {view === 'explore' && (
          <section className="wm-worlds">
            {WORLDS.map((world) => (
              <WorldBanner
                key={world.id}
                world={world}
                expanded={expandedWorldId === world.id}
                onToggle={() => setExpandedWorldId((cur) => (cur === world.id ? '' : world.id))}
                onPlayLevel={onPlayLevel}
              />
            ))}
          </section>
        )}

        {view === 'progress' && <ProgressPanel />}

        {view === 'settings' && (
          <SettingsPanel
            pathway={pathway}
            setPathway={setPathway}
            identity={identity}
            onLogOut={onLogOut}
            muted={muted}
            onToggleMute={onToggleMute}
          />
        )}
      </main>
    </div>
  );
}
