import { useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { SpaceScene } from './SpaceScene';
import { createSpacePhysics, MAX_ENERGY, MAX_LIVES } from './spacePhysics';
import type { DebrisPickup, EnemyEncounter, PlanetHazard } from './spaceLevel';
import { getMission } from '../curriculum/missions';
import { PyodideRunner } from '../python-lab/PyodideRunner';
import { PythonLabOverlay } from '../python-lab/PythonLabOverlay';
import './space-demo.css';

const LEVEL_TIME = 55;

export function SpaceDemo({ onExit }: { onExit: () => void }) {
  const physicsRef = useRef(createSpacePhysics());
  const fireApiRef = useRef<(() => void) | null>(null);
  const runnerRef = useRef<PyodideRunner | null>(null);
  if (!runnerRef.current) runnerRef.current = new PyodideRunner();

  const [intro, setIntro] = useState(true);
  const [timeLeft, setTimeLeft] = useState(LEVEL_TIME);
  const [debrisCount, setDebrisCount] = useState(0);
  const [lives, setLives] = useState(MAX_LIVES);
  const [energy, setEnergy] = useState(MAX_ENERGY);
  const [activePrompt, setActivePrompt] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [result, setResult] = useState<'none' | 'won' | 'lost' | 'destroyed'>('none');
  const [showLab, setShowLab] = useState(false);
  const [showTip, setShowTip] = useState(false);
  const toastTimer = useRef<number | null>(null);
  const tipTimer = useRef<number | null>(null);

  const mission = getMission('w1-l1');
  const running = !intro && result === 'none' && !showLab;

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          physicsRef.current.paused = true;
          setResult('lost');
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [running]);

  function showToast(msg: string, ms = 1300) {
    setToast(msg);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), ms);
  }

  function handlePlanetHit(_planet: PlanetHazard) {
    showToast('💥 Collision! The planet bursts into comets!');
  }

  function handleCometHit() {
    showToast('☄️ Hit by a comet shard!');
  }

  function handleLivesChange(nextLives: number) {
    setLives(nextLives);
    if (nextLives <= 0) {
      physicsRef.current.paused = true;
      setResult('destroyed');
    }
  }

  function handleEnergyChange(nextEnergy: number) {
    setEnergy(nextEnergy);
  }

  function handleDebrisCollected(_pickup: DebrisPickup) {
    setDebrisCount((c) => c + 1);
    showToast('♻️ Debris collected — energy +');
  }

  function handleEnemyResolved(_enemy: EnemyEncounter, correct: boolean) {
    if (correct) {
      setTimeLeft((t) => t + 5);
      showToast('🛸 UFO destroyed! Energy + life restored!');
    } else {
      showToast('❌ Not quite — that pod wasn’t it, try another.');
    }
  }

  function handleLevelComplete() {
    setShowLab(true);
  }

  function handleActivePromptChange(prompt: string | null) {
    setActivePrompt(prompt);
  }

  function startRun() {
    setIntro(false);
    physicsRef.current.paused = false;
    setShowTip(true);
    if (tipTimer.current) window.clearTimeout(tipTimer.current);
    tipTimer.current = window.setTimeout(() => setShowTip(false), 6000);
  }

  const mins = Math.floor(timeLeft / 60);
  const secs = String(timeLeft % 60).padStart(2, '0');

  return (
    <div className="spc-root">
      <Canvas shadows camera={{ fov: 62, near: 0.1, far: 220 }}>
        <SpaceScene
          physicsRef={physicsRef}
          fireApiRef={fireApiRef}
          callbacks={{
            onPlanetHit: handlePlanetHit,
            onCometHit: handleCometHit,
            onDebrisCollected: handleDebrisCollected,
            onEnemyResolved: handleEnemyResolved,
            onLevelComplete: handleLevelComplete,
            onLivesChange: handleLivesChange,
            onEnergyChange: handleEnergyChange,
            onActivePromptChange: handleActivePromptChange,
          }}
        />
      </Canvas>

      {running && activePrompt && <div className="spc-question-banner">{activePrompt}</div>}

      <div className="spc-hud" data-ui>
        <button className="spc-pill spc-back" onClick={onExit}>← Exit demo</button>
        <div className="spc-pill" data-low={timeLeft <= 10}>⏱ {mins}:{secs}</div>
        <div className="spc-pill">♻️ {debrisCount}</div>
      </div>
      <div className="spc-meters">
        <div className="spc-lives">{Array.from({ length: MAX_LIVES }).map((_, i) => (
          <span key={i} className={i < lives ? 'spc-life-on' : 'spc-life-off'}>🚀</span>
        ))}</div>
        <div className="spc-energy-track">
          <div className="spc-energy-fill" style={{ width: `${energy}%` }} />
        </div>
        <span className="spc-energy-label">⚡ {energy}</span>
      </div>
      {running && <div className="spc-mission-note">🌌 Space Guardians — dodge planets, clean the galaxy, destroy enemy UFOs</div>}

      {toast && <div className="spc-toast">{toast}</div>}
      {running && showTip && !toast && <div className="spc-tip">🧲 Fly close to the glowing ♻️ plastic — it gets pulled in and collected</div>}

      {running && (
        <div className="spc-controls">
          <div className="spc-dpad">
            <button className="spc-dpad-btn spc-dpad-up" onPointerDown={() => (physicsRef.current.moveY = 1)} onPointerUp={() => (physicsRef.current.moveY = 0)} aria-label="Up">▲</button>
            <div className="spc-dpad-mid">
              <button className="spc-dpad-btn" onPointerDown={() => (physicsRef.current.moveX = -1)} onPointerUp={() => (physicsRef.current.moveX = 0)} aria-label="Left">◀</button>
              <button className="spc-dpad-btn" onPointerDown={() => (physicsRef.current.moveX = 1)} onPointerUp={() => (physicsRef.current.moveX = 0)} aria-label="Right">▶</button>
            </div>
            <button className="spc-dpad-btn spc-dpad-down" onPointerDown={() => (physicsRef.current.moveY = -1)} onPointerUp={() => (physicsRef.current.moveY = 0)} aria-label="Down">▼</button>
          </div>
          <button className="spc-fire-btn" onClick={() => fireApiRef.current?.()} aria-label="Fire">🔫 FIRE</button>
        </div>
      )}

      {intro && (
        <div className="spc-overlay">
          <div className="spc-card">
            <h2>🌌 Space Guardians</h2>
            <p>
              Fly your ship through the galaxy. Steer with the D-pad (or arrows/WASD) to dodge
              the rotating planets — hit one and you lose a life, and it bursts into comet
              shards that keep flying and can hit you too. Fly through the floating plastic and
              debris to clean the galaxy and recharge energy — no shooting needed. When an enemy
              UFO blocks the way, line up with the correct answer pod and FIRE: a correct hit
              destroys the UFO and restores both energy and a lost life. At the end, a real code
              terminal opens for the actual mission.
            </p>
            <p className="spc-card-sub">3 lives. 55 seconds. Destroying a UFO adds time, energy, and a life.</p>
            <button className="spc-start-btn" onClick={startRun} autoFocus>Launch ▶</button>
          </div>
        </div>
      )}

      {(result === 'won' || result === 'lost' || result === 'destroyed') && !showLab && (
        <div className="spc-overlay">
          <div className="spc-card">
            <h2>
              {result === 'won' && '🏆 Sector cleared!'}
              {result === 'lost' && '⏱ Out of time'}
              {result === 'destroyed' && '💥 Ship destroyed'}
            </h2>
            <p>
              {result === 'won' && `${debrisCount} pieces of debris cleaned up. Great flying.`}
              {result === 'lost' && 'Out of time — try the run again.'}
              {result === 'destroyed' && 'Too many collisions — watch your steering next run.'}
            </p>
            <button className="spc-start-btn" onClick={onExit}>Back</button>
          </div>
        </div>
      )}

      {showLab && mission && (
        <PythonLabOverlay
          mission={mission}
          runner={runnerRef.current}
          onClose={onExit}
          onMissionComplete={() => showToast('✅ Real code verified — mission complete!', 2000)}
          onContinue={onExit}
          onBackToMap={onExit}
        />
      )}
    </div>
  );
}
