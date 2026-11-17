import { useState } from 'react';
import type { WorldBoss } from './bossChallenges';
import { sfx } from '../audio/sfx';
import './runner.css';

export function BossChallengeOverlay({
  boss,
  hitIndex,
  onHit,
  onWrong,
}: {
  boss: WorldBoss;
  hitIndex: number;
  onHit: () => void;
  onWrong: () => void;
}) {
  const challenge = boss.hits[hitIndex];
  const [choice, setChoice] = useState<number | null>(null);
  const [wrongTry, setWrongTry] = useState(false);

  function pick(i: number) {
    setChoice(i);
    if (i === challenge.correctIndex) {
      setWrongTry(false);
      sfx.playSuccess();
    } else {
      setWrongTry(true);
      sfx.playError();
      onWrong();
    }
  }

  function confirmHit() {
    setChoice(null);
    setWrongTry(false);
    onHit();
  }

  return (
    <div className="boss-overlay" data-ui>
      <div className="boss-panel">
        <h2>⚔️ {boss.name} — Hit {hitIndex + 1} of {boss.hits.length}</h2>
        <p className="boss-prompt">{challenge.prompt}</p>
        <pre className="boss-snippet">{challenge.snippet}</pre>
        <div className="boss-options">
          {challenge.options.map((opt, i) => (
            <button
              key={i}
              className={`boss-option ${choice === i ? (i === challenge.correctIndex ? 'correct' : 'wrong') : ''}`}
              onClick={() => pick(i)}
            >
              {opt}
            </button>
          ))}
        </div>
        {choice !== null && choice === challenge.correctIndex && (
          <div className="boss-feedback correct">
            ✅ {challenge.explanation}
            <button className="boss-btn boss-btn-primary" onClick={confirmHit}>
              Land the hit! →
            </button>
          </div>
        )}
        {wrongTry && choice !== challenge.correctIndex && (
          <div className="boss-feedback wrong">Not quite — the monster shrugs it off. Try another answer.</div>
        )}
      </div>
    </div>
  );
}
