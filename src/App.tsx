import { useEffect, useRef, useState } from 'react';
import { GameScene } from './game/engine/GameScene';
import { getMission } from './curriculum/missions';
import type { LevelDef } from './curriculum/worlds';
import { progressService } from './progress/progressService';
import { PyodideRunner } from './python-lab/PyodideRunner';
import { PythonLabOverlay } from './python-lab/PythonLabOverlay';
import { WorldMapScreen } from './ui/WorldMapScreen';
import { HUD } from './ui/HUD';
import { TouchControls } from './ui/TouchControls';
import { PauseMenu } from './ui/PauseMenu';
import { DialogBubble } from './ui/DialogBubble';
import './ui/dialog-bubble.css';
import './App.css';

function isTouchDevice() {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

type Screen = 'hub' | 'game';

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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [labOpen, setLabOpen] = useState(false);
  const [paused, setPaused] = useState(false);
  const [bootError, setBootError] = useState<string | null>(null);
  const [gameReady, setGameReady] = useState(false);

  useEffect(() => {
    if (!runnerRef.current) runnerRef.current = new PyodideRunner();
  }, []);

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
          onInteractTerminal: () => setLabOpen(true),
        },
        activeLevel.topic,
      );
      gameRef.current = game;
      setGameReady(true);
    } catch (err: any) {
      console.error('Failed to start the 3D scene', err);
      setBootError(String(err?.message ?? err));
    }
    return () => {
      gameRef.current?.dispose();
      gameRef.current = null;
      setGameReady(false);
      setNearNpc(false);
      setNearTerminal(false);
      setDialogOpen(false);
      setLabOpen(false);
      setBootError(null);
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

  const missionText = !activeLevel
    ? ''
    : missionDone
      ? `Level ${activeLevel.globalNumber} complete — explore the village, or head back to the map!`
      : `Level ${activeLevel.globalNumber}: ${activeLevel.topic} — find Py-Guide, then reach the terminal.`;

  const promptVisible = (nearNpc || nearTerminal) && !dialogOpen && !labOpen && !paused;

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
        missionText={missionText}
        missionDone={missionDone}
        onPause={() => setPaused(true)}
        onBackToMap={handleBackToMap}
      />

      {promptVisible && (
        <div className="interact-prompt" data-ui>
          Press <kbd>E</kbd> / tap <b>TALK · USE</b>
        </div>
      )}

      {gameReady && gameRef.current && (
        <TouchControls input={gameRef.current.input} visible={isTouchDevice()} />
      )}
      {isTouchDevice() && gameReady && gameRef.current && (
        <button
          className="touch-interact-fab"
          data-ui
          style={{ display: nearNpc || nearTerminal ? 'block' : 'none' }}
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

      {labOpen && runnerRef.current && mission && activeLevel && (
        <PythonLabOverlay
          key={mission.id}
          mission={mission}
          runner={runnerRef.current}
          onClose={() => setLabOpen(false)}
          onMissionComplete={() => {
            // Recorded once, the moment the check passes — regardless of
            // which button the student clicks next on the success panel.
            setMissionDone(true);
            setXp((x) => x + mission.rewardXp);
            setScore((s) => s + mission.rewardCoins);
            progressService.completeLevel(activeLevel.id, mission.rewardXp, mission.rewardCoins);
            gameRef.current?.markTerminalSolved();
          }}
          onContinue={() => setLabOpen(false)}
          onBackToMap={handleBackToMap}
        />
      )}

      {paused && <PauseMenu onResume={() => setPaused(false)} />}
    </div>
  );
}
