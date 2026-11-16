import { useEffect, useRef, useState } from 'react';
import { GameScene } from './game/engine/GameScene';
import { MISSION_1 } from './game/missions/mission1';
import { PyodideRunner } from './python-lab/PyodideRunner';
import { PythonLabOverlay } from './python-lab/PythonLabOverlay';
import { HUD } from './ui/HUD';
import { TouchControls } from './ui/TouchControls';
import { PauseMenu } from './ui/PauseMenu';
import { DialogBubble } from './ui/DialogBubble';
import './ui/dialog-bubble.css';
import './App.css';

function isTouchDevice() {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<GameScene | null>(null);
  const runnerRef = useRef<PyodideRunner | null>(null);

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
    if (!canvasRef.current) return;
    try {
      const game = new GameScene(canvasRef.current, {
        onScoreChange: setScore,
        onNearNpc: setNearNpc,
        onNearTerminal: setNearTerminal,
        onInteractNpc: () => setDialogOpen(true),
        onInteractTerminal: () => setLabOpen(true),
      });
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
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    gameRef.current?.setPaused(paused || labOpen || dialogOpen);
  }, [paused, labOpen, dialogOpen]);

  const missionText = missionDone
    ? 'Mission complete — explore the village!'
    : 'Find Py-Guide, then reach the glowing terminal and write real Python.';

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

      {labOpen && runnerRef.current && (
        <PythonLabOverlay
          mission={MISSION_1}
          runner={runnerRef.current}
          onClose={() => setLabOpen(false)}
          onSuccess={() => {
            setMissionDone(true);
            setXp((x) => x + MISSION_1.rewardXp);
            setScore((s) => s + MISSION_1.rewardCoins);
            gameRef.current?.markTerminalSolved();
            setLabOpen(false);
          }}
        />
      )}

      {paused && <PauseMenu onResume={() => setPaused(false)} />}
    </div>
  );
}
