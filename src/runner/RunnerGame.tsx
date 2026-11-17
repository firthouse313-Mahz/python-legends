import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { RunnerSceneContents } from './RunnerSceneContents';
import { RunnerControls } from './runnerControls';
import { createPhysics } from './physics';
import { buildTrack, startXForCompletedLevels, type TrackGate } from './trackData';
import { themeFor } from './worldThemes';
import { BOSSES } from './bossChallenges';
import { getMission } from '../curriculum/missions';
import type { WorldDef } from '../curriculum/worlds';
import { progressService } from '../progress/progressService';
import { PyodideRunner } from '../python-lab/PyodideRunner';
import { PythonLabOverlay } from '../python-lab/PythonLabOverlay';
import { BossChallengeOverlay } from './BossChallengeOverlay';
import { PauseMenu } from '../ui/PauseMenu';
import { sfx } from '../audio/sfx';
import './runner.css';

function isTouchDevice() {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

export function RunnerGame({
  world,
  runner,
  onBackToMap,
}: {
  world: WorldDef;
  runner: PyodideRunner;
  onBackToMap: () => void;
}) {
  const canvasWrapRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<RunnerControls | null>(null);

  const theme = useMemo(() => themeFor(world.id), [world.id]);
  const boss = BOSSES[world.id] ?? BOSSES['world-1'];
  const bonusId = `${world.id}-boss`;

  const playableLevelIds = useMemo(
    () => world.levels.filter((l) => l.implemented && l.missionId).map((l) => l.id),
    [world],
  );
  const track = useMemo(() => buildTrack(playableLevelIds), [playableLevelIds]);

  const completedLevelIds = track.gates.filter((g) => progressService.isCompleted(g.levelId)).map((g) => g.levelId);
  const startX = useRef(startXForCompletedLevels(track.gates, completedLevelIds)).current;
  const physicsRef = useRef(createPhysics(startX));
  const lastCheckpointXRef = useRef(startX);
  if (physicsRef.current.completedGates.size === 0) {
    for (const id of completedLevelIds) physicsRef.current.completedGates.add(id);
  }
  // Created synchronously (not in an effect) because a plain ref's
  // .current never triggers a re-render — gating <RunnerSceneContents>
  // render on "controlsRef.current &&" left it permanently unmounted
  // since the effect that created it never caused React to look again.
  if (!controlsRef.current) controlsRef.current = new RunnerControls();
  const controls = controlsRef.current;

  const [energy, setEnergy] = useState(100);
  const [coins, setCoins] = useState(() => progressService.getTotalCoins());
  const [xp, setXp] = useState(() => progressService.getTotalXp());
  const [activeGate, setActiveGate] = useState<TrackGate | null>(null);
  const [bossPhase, setBossPhase] = useState<'none' | 'fighting' | 'defeated'>(
    progressService.isBonusCompleted(bonusId) ? 'defeated' : 'none',
  );
  const [bossHitIndex, setBossHitIndex] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const toastTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    sfx.startAmbient();
    // Dev-only hook for automated QA (Playwright) to read/drive the runner
    // state directly instead of guessing position from key-hold timing.
    // Never present in a production build.
    if (import.meta.env.DEV) {
      (window as any).__ptlgRunnerState = () => ({
        x: physicsRef.current.x,
        y: physicsRef.current.y,
        paused: physicsRef.current.paused,
        completedGates: [...physicsRef.current.completedGates],
      });
      (window as any).__ptlgRunnerJump = () => controls.jump();
      (window as any).__ptlgRunnerSlide = () => controls.slide();
    }
    return () => {
      controls.dispose();
      sfx.stopAmbient();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    physicsRef.current.paused = !!activeGate || bossPhase === 'fighting' || paused;
  }, [activeGate, bossPhase, paused]);

  function showToast(message: string, ms = 2200) {
    setToast(message);
    if (toastTimeoutRef.current) window.clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = window.setTimeout(() => setToast(null), ms);
  }

  function respawnAtCheckpoint() {
    const p = physicsRef.current;
    p.x = lastCheckpointXRef.current;
    p.y = 0;
    p.vy = 0;
    p.grounded = true;
    p.sliding = false;
    setEnergy(100);
    showToast('Caught your breath — back to the last checkpoint.');
  }

  function handleHit(shieldAbsorbed: boolean) {
    sfx.playZap();
    if (shieldAbsorbed) {
      showToast('🛡️ Your shield absorbed the hit!');
      return;
    }
    setEnergy((e) => {
      const next = Math.max(0, e - 20);
      if (next <= 0) respawnAtCheckpoint();
      return next;
    });
  }

  function handleCollect(kind: 'coin' | 'shield' | 'boost') {
    if (kind === 'coin') {
      setCoins((c) => c + 1);
      sfx.playCoin();
    } else if (kind === 'shield') {
      showToast('🛡️ Shield ready — your next hit is free.');
      sfx.playPowerUp();
    } else {
      showToast('⚡ Speed boost!');
      sfx.playPowerUp();
    }
  }

  function handleReachGate(gate: TrackGate) {
    setActiveGate(gate);
  }

  function handleReachBoss() {
    setBossPhase('fighting');
    setBossHitIndex(0);
  }

  const mission = activeGate ? getMission(activeGate.missionId) : undefined;

  return (
    <div className="runner-root" ref={canvasWrapRef}>
      <Canvas shadows camera={{ fov: 55, near: 0.1, far: 500 }}>
        <RunnerSceneContents
          track={track}
          theme={theme}
          physicsRef={physicsRef}
          controls={controls}
          callbacks={{
            onHit: handleHit,
            onCollect: handleCollect,
            onReachGate: handleReachGate,
            onReachBoss: handleReachBoss,
            onDepleted: () => {},
            onTouchdown: () => {},
            bossHitsLanded: bossHitIndex,
            bossTotalHits: boss.hits.length,
            bossDefeated: bossPhase === 'defeated',
          }}
        />
      </Canvas>

      {/* HUD */}
      <div className="runner-hud" data-ui>
        <div className="runner-hud-top">
          <button className="runner-pill runner-back" onClick={onBackToMap}>
            ← Map
          </button>
          <div className="runner-pill">🪙 {coins}</div>
          <div className="runner-pill">⭐ {xp} XP</div>
          <button className="runner-pill runner-mute" onClick={() => sfx.toggleMute()} aria-label="Toggle sound">
            🔊
          </button>
          <button className="runner-pill runner-pause" onClick={() => setPaused(true)} aria-label="Pause">
            ⏸
          </button>
        </div>
        <div className="runner-energy" data-ui>
          <span>⚡</span>
          <div className="runner-energy-track">
            <div className="runner-energy-fill" style={{ width: `${energy}%` }} />
          </div>
          <span className="runner-energy-label">{energy}</span>
        </div>
        <div className="runner-progress" data-ui>
          {track.gates.filter((g) => physicsRef.current.completedGates.has(g.levelId)).length} / {track.gates.length} levels
          {bossPhase === 'defeated' ? ` — ${world.name} complete! 🏆` : ''}
        </div>
      </div>

      {toast && <div className="runner-toast" data-ui>{toast}</div>}

      {/* Touch controls */}
      {isTouchDevice() && !activeGate && bossPhase !== 'fighting' && !paused && (
        <div className="runner-touch" data-ui>
          <button className="runner-touch-btn" onTouchStart={(e) => { e.preventDefault(); controls.jump(); }}>
            ⬆ JUMP
          </button>
          <button className="runner-touch-btn" onTouchStart={(e) => { e.preventDefault(); controls.slide(); }}>
            ⬇ SLIDE
          </button>
        </div>
      )}

      {activeGate && mission && (
        <PythonLabOverlay
          key={mission.id}
          mission={mission}
          runner={runner}
          onClose={() => setActiveGate(null)}
          onMissionComplete={() => {
            progressService.completeLevel(activeGate.levelId, mission.rewardXp, mission.rewardCoins);
            setXp((x) => x + mission.rewardXp);
            setCoins((c) => c + mission.rewardCoins);
            physicsRef.current.completedGates.add(activeGate.levelId);
            lastCheckpointXRef.current = activeGate.x + 2;
          }}
          onContinue={() => {
            setActiveGate(null);
            showToast('✅ Checkpoint reached — the run continues!');
          }}
          onBackToMap={onBackToMap}
        />
      )}

      {bossPhase === 'fighting' && (
        <BossChallengeOverlay
          boss={boss}
          hitIndex={bossHitIndex}
          onWrong={() => setEnergy((e) => Math.max(10, e - 15))}
          onHit={() => {
            const next = bossHitIndex + 1;
            if (next >= boss.hits.length) {
              progressService.completeBonus(bonusId, 100, 20);
              setXp((x) => x + 100);
              setCoins((c) => c + 20);
              setBossPhase('defeated');
              showToast(`🏆 ${boss.name} is defeated! ${world.name} complete!`, 4000);
            } else {
              setBossHitIndex(next);
            }
          }}
        />
      )}

      {paused && <PauseMenu onResume={() => setPaused(false)} />}
    </div>
  );
}
