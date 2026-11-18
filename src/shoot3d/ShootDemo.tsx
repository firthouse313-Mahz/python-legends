import { useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { ShootScene } from './ShootScene';
import { createShootPhysics, MAX_ENERGY } from './shootPhysics';
import type { ShootGate } from './shootGates';
import { getMission } from '../curriculum/missions';
import { PyodideRunner } from '../python-lab/PyodideRunner';
import { PythonLabOverlay } from '../python-lab/PythonLabOverlay';
import '../runner/runner.css';
import './shoot-demo.css';

const LEVEL_TIME = 45;

export function ShootDemo({ onExit }: { onExit: () => void }) {
  const physicsRef = useRef(createShootPhysics());
  const fireApiRef = useRef<(() => void) | null>(null);
  const runnerRef = useRef<PyodideRunner | null>(null);
  if (!runnerRef.current) runnerRef.current = new PyodideRunner();

  const [intro, setIntro] = useState(true);
  const [timeLeft, setTimeLeft] = useState(LEVEL_TIME);
  const [coins, setCoins] = useState(0);
  const [energy, setEnergy] = useState(MAX_ENERGY);
  const [toast, setToast] = useState<string | null>(null);
  const [result, setResult] = useState<'none' | 'won' | 'lost' | 'caught'>('none');
  const [showLab, setShowLab] = useState(false);
  const toastTimer = useRef<number | null>(null);

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

  function handleGateHit(_gate: ShootGate, correct: boolean) {
    if (correct) {
      setCoins((c) => c + 5);
      setTimeLeft((t) => t + 5);
      showToast('🎯 Direct hit — boost +5s!');
    } else {
      showToast('💥 Missed — the chaser closes in!');
    }
  }

  function handleEnergyChange(nextEnergy: number) {
    setEnergy(nextEnergy);
    if (nextEnergy <= 0) {
      physicsRef.current.paused = true;
      setResult('caught');
    }
  }

  function handleLevelComplete() {
    setShowLab(true);
  }

  function startRun() {
    setIntro(false);
    physicsRef.current.paused = false;
  }

  const mins = Math.floor(timeLeft / 60);
  const secs = String(timeLeft % 60).padStart(2, '0');
  const aimLabels = ['◀ LEFT', 'CENTER', 'RIGHT ▶'];

  return (
    <div className="runner-root">
      <Canvas shadows camera={{ fov: 58, near: 0.1, far: 200 }}>
        <ShootScene
          physicsRef={physicsRef}
          fireApiRef={fireApiRef}
          callbacks={{ onGateHit: handleGateHit, onLevelComplete: handleLevelComplete, onEnergyChange: handleEnergyChange }}
        />
      </Canvas>

      {/* HUD chrome reused from Python Legends' own runner — energy bar,
          pill style — so this mode still reads as Python Legends, not a
          recolor of SQL Quest's demo. */}
      <div className="runner-hud" data-ui>
        <div className="runner-hud-top">
          <button className="runner-pill runner-back" onClick={onExit}>← Exit demo</button>
          <div className="runner-pill" data-low={timeLeft <= 10}>⏱ {mins}:{secs}</div>
          <div className="runner-pill">🪙 {coins}</div>
        </div>
        <div className="runner-energy" data-ui>
          <span>⚡</span>
          <div className="runner-energy-track">
            <div className="runner-energy-fill" style={{ width: `${energy}%` }} />
          </div>
          <span className="runner-energy-label">{energy}</span>
        </div>
        {running && <div className="runner-progress" data-ui>🐛 Bug Hunt — a wild pursuer closes in on every miss</div>}
      </div>

      {running && (
        <div className="sd-aim-indicator">
          🎯 AIMING: <b>{aimLabels[physicsRef.current.aim]}</b> — move with ◀ ▶, then FIRE
        </div>
      )}

      {toast && <div className="sd-toast">{toast}</div>}

      {running && (
        <div className="sd-controls">
          <div className="sd-lane-btns">
            <button
              className="sd-ctrl-btn"
              onClick={() => { const p = physicsRef.current; p.aim = ((p.aim + 2) % 3) as 0 | 1 | 2; }}
              aria-label="Cycle target left"
            >
              ◀
            </button>
            <button
              className="sd-ctrl-btn"
              onClick={() => { const p = physicsRef.current; p.aim = ((p.aim + 1) % 3) as 0 | 1 | 2; }}
              aria-label="Cycle target right"
            >
              ▶
            </button>
          </div>
          <button className="sd-fire-btn" onClick={() => fireApiRef.current?.()} aria-label="Fire">
            🔫 FIRE
          </button>
        </div>
      )}

      {intro && (
        <div className="sd-overlay">
          <div className="sd-card">
            <h2>Python Forest — Bug Hunt</h2>
            <p>
              Glitch bugs scatter through the trees ahead, each carrying a possible answer.
              Cycle targets with ◀ ▶, fire with the button (or F / Enter) — you never stop
              running. Miss, and the pursuer behind you closes in; three misses and it catches
              you. At the end, a real code terminal opens for the actual challenge.
            </p>
            <p className="sd-card-sub">45 seconds on the clock. Correct hits add time.</p>
            <button className="sd-start-btn" onClick={startRun} autoFocus>
              Start run ▶
            </button>
          </div>
        </div>
      )}

      {(result === 'won' || result === 'lost' || result === 'caught') && !showLab && (
        <div className="sd-overlay">
          <div className="sd-card">
            <h2>
              {result === 'won' && '🏆 Cleared!'}
              {result === 'lost' && '⏱ Out of time'}
              {result === 'caught' && '🐛 The bugs caught you!'}
            </h2>
            <p>
              {result === 'won' && `${coins} coins collected. Nice shooting.`}
              {result === 'lost' && 'Out of time — try the run again.'}
              {result === 'caught' && 'Too many misses let the pursuer catch up — try again and watch your energy.'}
            </p>
            <button className="sd-start-btn" onClick={onExit}>Back</button>
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
