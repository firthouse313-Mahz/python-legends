import './hud.css';

interface Props {
  score: number;
  xp: number;
  /** Non-null only on the hurdle level (World 1, Level 1) — 0-100. */
  energy?: number | null;
  missionText: string;
  missionDone: boolean;
  onPause: () => void;
  onBackToMap?: () => void;
}

export function HUD({ score, xp, energy, missionText, missionDone, onPause, onBackToMap }: Props) {
  return (
    <div className="hud" data-ui>
      <div className="hud-top">
        {onBackToMap && (
          <button className="hud-back" onClick={onBackToMap} aria-label="Back to World Map">
            ← Map
          </button>
        )}
        <div className="hud-stat">
          <span className="hud-icon">🪙</span>
          <span>{score}</span>
        </div>
        <div className="hud-stat">
          <span className="hud-icon">⭐</span>
          <span>{xp} XP</span>
        </div>
        <button className="hud-pause" onClick={onPause} aria-label="Pause">⏸</button>
      </div>
      {energy !== null && energy !== undefined && (
        <div className="hud-energy" data-ui>
          <span className="hud-energy-icon">⚡</span>
          <div className="hud-energy-track">
            <div className="hud-energy-fill" style={{ width: `${Math.min(100, energy)}%` }} />
          </div>
          <span className="hud-energy-label">{Math.round(energy)}</span>
        </div>
      )}
      <div className={`hud-mission ${missionDone ? 'hud-mission-done' : ''}`}>
        <span className="hud-mission-icon">{missionDone ? '✅' : '🎯'}</span>
        <span>{missionText}</span>
      </div>
    </div>
  );
}
