import { useEffect, useRef, useState } from 'react';
import { GameScene } from './game/engine/GameScene';
import { getMission } from './curriculum/missions';
import { ENERGY_CHALLENGES } from './curriculum/energyChallenges';
import { getNextPlayableLevel, type LevelDef } from './curriculum/worlds';
import { progressService } from './progress/progressService';
import { PyodideRunner } from './python-lab/PyodideRunner';
import { PythonLabOverlay } from './python-lab/PythonLabOverlay';
import { WorldMapScreen } from './ui/WorldMapScreen';
import { HUD } from './ui/HUD';
import { TouchControls } from './ui/TouchControls';
import { PauseMenu } from './ui/PauseMenu';
import { DialogBubble } from './ui/DialogBubble';
import { sfx } from './audio/sfx';
import './ui/dialog-bubble.css';
import './App.css';

function isTouchDevice() {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

type Screen = 'hub' | 'game';
type LabTarget = { kind: 'main' } | { kind: 'conduit'; index: number };

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<GameScene | null>(null);
  const runnerRef = useRef<PyodideRunner | null>(null);

  const [screen, setScreen] = useState<Screen>('hub');
  const [activeLevel, setActiveLevel] = useState<LevelDef | null>(null);

  const [score, setScore] = useState(0);
  const [xp, setXp] = useState(0);
  const [missionDone, setMissionDone] = useState(false);
  const [nearNpc, setNearNpc] = useState(false);
  const [nearTerminal, setNearTerminal] = useState(false);
  const [nearConduit, setNearConduit] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [labTarget, setLabTarget] = useState<LabTarget | null>(null);
  const [paused, setPaused] = useState(false);
  const [bootError, setBootError] = useState<string | null>(null);
  const [gameReady, setGameReady] = useState(false);
  const [energy, setEnergy] = useState<number | null>(null);
  const [zapToast, setZapToast] = useState(false);
  const [gateOpenToast, setGateOpenToast] = useState(false);
  const [muted, setMuted] = useState(() => sfx.isMuted);
  const zapTimeoutRef = useRef<number | null>(null);
  const gateTimeoutRef = useRef<number | null>(null);

  const labOpen = labTarget !== null;

  useEffect(() => {
    if (!runnerRef.current) runnerRef.current = new PyodideRunner();
  }, []);

  // Browsers block audio output until a real user gesture happens on the
  // page — unlock the sound engine on the very first click/tap/keypress,
  // once, then stop listening.
  useEffect(() => {
    const unlock = () => {
      sfx.unlock();
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  function toggleMute() {
    setMuted(sfx.toggleMute());
  }

  useEffect(() => {
    if (screen !== 'game' || !activeLevel || !canvasRef.current) return;
    setMissionDone(progressService.isCompleted(activeLevel.id));
    progressService.markStarted(activeLevel.id);
    try {
      const game = new GameScene(
        canvasRef.current,
        {
          onScoreChange: setScore,
          onNearNpc: setNearNpc,
          onNearTerminal: setNearTerminal,
          onInteractNpc: () => setDialogOpen(true),
          onInteractTerminal: () => setLabTarget({ kind: 'main' }),
          onNearConduit: setNearConduit,
          onInteractConduit: (index) => setLabTarget({ kind: 'conduit', index }),
          onEnergyChange: setEnergy,
          onGateOpen: () => {
            setGateOpenToast(true);
            if (gateTimeoutRef.current) window.clearTimeout(gateTimeoutRef.current);
            gateTimeoutRef.current = window.setTimeout(() => setGateOpenToast(false), 2600);
          },
          onZapped: () => {
            setZapToast(true);
            if (zapTimeoutRef.current) window.clearTimeout(zapTimeoutRef.current);
            zapTimeoutRef.current = window.setTimeout(() => setZapToast(false), 1600);
          },
        },
        activeLevel.topic,
        activeLevel.id,
      );
      gameRef.current = game;
      if (game.isHurdleLevel) setEnergy(0);
      setGameReady(true);
      sfx.startAmbient();
      // Dev-only hook for automated QA (Playwright) to read the player's
      // real position instead of guessing it from key-hold timing. Never
      // present in a production build.
      if (import.meta.env.DEV) {
        (window as any).__ptlgDebugPos = () => {
          const p = game.player.position;
          return { x: p.x, y: p.y, z: p.z };
        };
        (window as any).__ptlgDebugState = () => ({
          player: { x: game.player.position.x, y: game.player.position.y, z: game.player.position.z },
          energy: game.energy,
          gate: game.gate
            ? {
                checkCollisions: game.gate.mesh.checkCollisions,
                isOpen: game.gate.isOpen,
                y: game.gate.mesh.position.y,
                enabled: game.gate.mesh.isEnabled(),
              }
            : null,
          guardian: game.guardian
            ? { state: (game.guardian as any).state, pos: { x: game.guardian.position.x, z: game.guardian.position.z } }
            : null,
        });
      }
    } catch (err: any) {
      console.error('Failed to start the 3D scene', err);
      setBootError(String(err?.message ?? err));
    }
    return () => {
      sfx.stopAmbient();
      gameRef.current?.dispose();
      gameRef.current = null;
      setGameReady(false);
      setNearNpc(false);
      setNearTerminal(false);
      setNearConduit(false);
      setDialogOpen(false);
      setLabTarget(null);
      setBootError(null);
      setEnergy(null);
      setZapToast(false);
      setGateOpenToast(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, activeLevel]);

  useEffect(() => {
    gameRef.current?.setPaused(paused || labOpen || dialogOpen);
  }, [paused, labOpen, dialogOpen]);

  function handlePlayLevel(level: LevelDef) {
    const mission = level.missionId ? getMission(level.missionId) : undefined;
    if (!mission) return; // coming-soon / not-yet-implemented level — nothing to play.
    setActiveLevel(level);
    setScreen('game');
  }

  function handleBackToMap() {
    setScreen('hub');
    setActiveLevel(null);
    setPaused(false);
  }

  if (screen === 'hub') {
    return <WorldMapScreen onPlayLevel={handlePlayLevel} />;
  }

  const mission = activeLevel?.missionId ? getMission(activeLevel.missionId) : undefined;
  const isHurdleLevel = gameRef.current?.isHurdleLevel ?? activeLevel?.id === 'w1-l1';

  const missionText = !activeLevel
    ? ''
    : missionDone
      ? `Level ${activeLevel.globalNumber} complete — explore the village, or head back to the map!`
      : isHurdleLevel
        ? energy !== null && energy >= 100
          ? 'Vault Gate open — run past the Guardian and reach the terminal!'
          : 'Find both glowing Energy Conduits, solve their Python, and charge the Vault Gate — watch for the Guardian!'
        : `Level ${activeLevel.globalNumber}: ${activeLevel.topic} — find Py-Guide, then reach the terminal.`;

  const activeLabMission =
    labTarget?.kind === 'conduit' ? ENERGY_CHALLENGES[labTarget.index] : labTarget?.kind === 'main' ? mission : undefined;

  // The next level in the same world, if one exists — lets a student chain
  // straight from one level's terminal into the next without a detour back
  // to the World Map hub in between.
  const nextLevel = activeLevel ? getNextPlayableLevel(activeLevel.id) : undefined;

  const promptVisible = (nearNpc || nearTerminal || nearConduit) && !dialogOpen && !labOpen && !paused;

  return (
    <div className="app-root">
      <canvas ref={canvasRef} className="game-canvas" />

      {bootError && (
        <div className="boot-error" data-ui>
          <h2>Couldn't start the 3D scene</h2>
          <pre>{bootError}</pre>
          <p>Your browser/device may not support WebGL, or a graphics context could not be created.</p>
        </div>
      )}

      <HUD
        score={score}
        xp={xp}
        energy={energy}
        missionText={missionText}
        missionDone={missionDone}
        muted={muted}
        onToggleMute={toggleMute}
        onPause={() => setPaused(true)}
        onBackToMap={handleBackToMap}
      />

      {promptVisible && (
        <div className="interact-prompt" data-ui>
          Press <kbd>E</kbd> / tap <b>TALK · USE</b>
        </div>
      )}

      {zapToast && (
        <div className="zap-toast" data-ui>
          ⚡ Caught by the Guardian! {isHurdleLevel ? '−20 energy' : '−2 coins'}
        </div>
      )}
      {gateOpenToast && (
        <div className="gate-toast" data-ui>
          🔓 Vault Gate charged — the way to the terminal is open!
        </div>
      )}

      {gameReady && gameRef.current && (
        <TouchControls input={gameRef.current.input} visible={isTouchDevice()} />
      )}
      {isTouchDevice() && gameReady && gameRef.current && (
        <button
          className="touch-interact-fab"
          data-ui
          style={{ display: nearNpc || nearTerminal || nearConduit ? 'block' : 'none' }}
          onTouchStart={(e) => {
            e.preventDefault();
            gameRef.current?.triggerInteract();
          }}
        >
          TALK / USE
        </button>
      )}

      {dialogOpen && gameRef.current && (
        <DialogBubble lines={gameRef.current.npc.dialog} onClose={() => setDialogOpen(false)} />
      )}

      {labTarget && runnerRef.current && activeLabMission && activeLevel && (
        <PythonLabOverlay
          key={activeLabMission.id}
          mission={activeLabMission}
          runner={runnerRef.current}
          onClose={() => setLabTarget(null)}
          onMissionComplete={() => {
            // Recorded once, the moment the check passes — regardless of
            // which button the student clicks next on the success panel.
            if (labTarget.kind === 'main' && mission) {
              setMissionDone(true);
              setXp((x) => x + mission.rewardXp);
              setScore((s) => s + mission.rewardCoins);
              progressService.completeLevel(activeLevel.id, mission.rewardXp, mission.rewardCoins);
              gameRef.current?.markTerminalSolved();
            } else if (labTarget.kind === 'conduit') {
              const challenge = ENERGY_CHALLENGES[labTarget.index];
              setXp((x) => x + challenge.rewardXp);
              setScore((s) => s + challenge.rewardCoins);
              gameRef.current?.markConduitSolved(labTarget.index);
            }
          }}
          onContinue={() => setLabTarget(null)}
          onBackToMap={handleBackToMap}
          onNextLevel={
            labTarget.kind === 'main' && nextLevel
              ? () => {
                  setLabTarget(null);
                  // Same 3D session, no map screen in between — just hands
                  // the next level's LevelDef to the existing effect, which
                  // tears down and rebuilds the scene for it immediately.
                  setActiveLevel(nextLevel);
                }
              : undefined
          }
          nextLevelLabel={nextLevel ? `Level ${nextLevel.globalNumber}: ${nextLevel.topic}` : undefined}
        />
      )}

      {paused && <PauseMenu onResume={() => setPaused(false)} />}
    </div>
  );
}
