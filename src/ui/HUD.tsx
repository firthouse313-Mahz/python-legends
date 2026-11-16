import './hud.css';

interface Props {
  score: number;
  xp: number;
  missionText: string;
  missionDone: boolean;
  onPause: () => void;
  onBackToMap?: () => void;
}

export function HUD({ score, xp, missionText, missionDone, onPause, onBackToMap }: Props) {
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
      <div className={`hud-mission ${missionDone ? 'hud-mission-done' : ''}`}>
        <span className="hud-mission-icon">{missionDone ? '✅' : '🎯'}</span>
        <span>{missionText}</span>
      </div>
    </div>
  );
}
