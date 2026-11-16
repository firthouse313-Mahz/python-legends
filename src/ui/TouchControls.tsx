import { useEffect, useRef, useState } from 'react';
import { InputManager } from '../game/controls/InputManager';
import './touch-controls.css';

interface Props {
  input: InputManager;
  visible: boolean;
}

/**
 * Left: a virtual joystick for movement. Right: jump / interact / run
 * buttons, plus a drag area for camera look (handled by InputManager's own
 * pointer listeners on the canvas, so the look-pad here just needs to not
 * intercept clicks meant for the canvas beneath it — it's a thin strip).
 */
export function TouchControls({ input, visible }: Props) {
  const stickBaseRef = useRef<HTMLDivElement>(null);
  const [stickPos, setStickPos] = useState({ x: 0, y: 0 });
  const activeTouchId = useRef<number | null>(null);

  useEffect(() => {
    const base = stickBaseRef.current;
    if (!base) return;

    function toVector(clientX: number, clientY: number) {
      const rect = base!.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const maxR = rect.width / 2;
      let dx = clientX - cx;
      let dy = clientY - cy;
      const dist = Math.hypot(dx, dy);
      if (dist > maxR) {
        dx = (dx / dist) * maxR;
        dy = (dy / dist) * maxR;
      }
      setStickPos({ x: dx, y: dy });
      input.setMoveVector(dx / maxR, dy / maxR);
    }

    function onStart(e: TouchEvent) {
      const t = e.changedTouches[0];
      activeTouchId.current = t.identifier;
      toVector(t.clientX, t.clientY);
      e.preventDefault();
    }
    function onMove(e: TouchEvent) {
      for (const t of Array.from(e.changedTouches)) {
        if (t.identifier === activeTouchId.current) {
          toVector(t.clientX, t.clientY);
          e.preventDefault();
        }
      }
    }
    function onEnd(e: TouchEvent) {
      for (const t of Array.from(e.changedTouches)) {
        if (t.identifier === activeTouchId.current) {
          activeTouchId.current = null;
          setStickPos({ x: 0, y: 0 });
          input.setMoveVector(0, 0);
        }
      }
    }

    base.addEventListener('touchstart', onStart, { passive: false });
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onEnd);
    window.addEventListener('touchcancel', onEnd);
    return () => {
      base.removeEventListener('touchstart', onStart);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
      window.removeEventListener('touchcancel', onEnd);
    };
  }, [input]);

  if (!visible) return null;

  return (
    <div className="touch-controls" data-ui>
      <div className="stick-base" ref={stickBaseRef}>
        <div
          className="stick-knob"
          style={{ transform: `translate(${stickPos.x}px, ${stickPos.y}px)` }}
        />
      </div>

      <div className="touch-look-pad" aria-hidden="true" />

      <div className="touch-buttons">
        <button
          className="touch-btn touch-btn-run"
          onTouchStart={(e) => { e.preventDefault(); input.setRun(true); }}
          onTouchEnd={(e) => { e.preventDefault(); input.setRun(false); }}
        >
          RUN
        </button>
        <button
          className="touch-btn touch-btn-jump"
          onTouchStart={(e) => { e.preventDefault(); input.queueJump(); }}
        >
          ⤴
        </button>
        <button
          className="touch-btn touch-btn-interact"
          onTouchStart={(e) => { e.preventDefault(); input.queueInteract(); }}
        >
          TALK / USE
        </button>
      </div>
    </div>
  );
}
