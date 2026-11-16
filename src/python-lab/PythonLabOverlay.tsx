import { useEffect, useRef, useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import type { Mission } from '../curriculum/missions';
import { PyodideRunner } from './PyodideRunner';
import './python-lab.css';

interface Props {
  mission: Mission;
  runner: PyodideRunner;
  onClose: () => void;
  /** Called exactly once, the moment the check first passes — this is
   *  where XP/coins/progress should actually be recorded, regardless of
   *  which button the student clicks next on the success panel. */
  onMissionComplete: () => void;
  /** "Continue exploring" — close the overlay and stay in the 3D scene. */
  onContinue: () => void;
  /** Optional: when provided, the success panel offers a second button
   *  that leaves the 3D scene and returns to the World Map hub. */
  onBackToMap?: () => void;
}

type Phase = 'loading' | 'idle' | 'running' | 'success' | 'failed';

export function PythonLabOverlay({ mission, runner, onClose, onMissionComplete, onContinue, onBackToMap }: Props) {
  const [code, setCode] = useState(mission.starterCode);
  const [output, setOutput] = useState('');
  const [errorText, setErrorText] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>('loading');
  const succeeded = useRef(false);

  useEffect(() => {
    let cancelled = false;
    runner.waitUntilReady().then(() => {
      if (!cancelled) setPhase('idle');
    });
    return () => {
      cancelled = true;
    };
  }, [runner]);

  async function handleRun() {
    setPhase('running');
    setErrorText(null);
    const result = await runner.run(code, mission.providedInputs ?? []);
    setOutput(result.stdout);
    if (!result.ok) {
      setErrorText(result.error ?? 'Something went wrong running your code.');
      setPhase('failed');
      return;
    }
    const failure = mission.check(result.stdout, code);
    if (failure) {
      setErrorText(failure);
      setPhase('failed');
    } else {
      setPhase('success');
      if (!succeeded.current) {
        succeeded.current = true;
        onMissionComplete();
      }
    }
  }

  function handleReset() {
    setCode(mission.starterCode);
    setOutput('');
    setErrorText(null);
    setPhase('idle');
  }

  function handleClear() {
    setOutput('');
    setErrorText(null);
  }

  function handleContinue() {
    onContinue();
  }

  return (
    <div className="lab-overlay" data-ui>
      <div className="lab-panel">
        <header className="lab-header">
          <h2>🖥️ {mission.title}</h2>
          <button className="lab-close" onClick={onClose} aria-label="Close">✕</button>
        </header>

        <p className="lab-story">{mission.story}</p>

        <div className="lab-editor-wrap">
          {phase === 'loading' && <div className="lab-loading">Booting the real Python engine… (first time only)</div>}
          <CodeMirror
            value={code}
            height="220px"
            extensions={[python()]}
            onChange={(v) => setCode(v)}
            theme="dark"
            basicSetup={{ lineNumbers: true, foldGutter: false }}
          />
        </div>

        <div className="lab-toolbar">
          <button className="lab-btn lab-btn-primary" disabled={phase === 'loading' || phase === 'running'} onClick={handleRun}>
            {phase === 'running' ? 'Running…' : '▶ Run'}
          </button>
          <button className="lab-btn" onClick={handleReset}>↺ Reset</button>
          <button className="lab-btn" onClick={handleClear}>🧹 Clear output</button>
        </div>

        <div className="lab-console" aria-live="polite">
          <div className="lab-console-label">Output</div>
          <pre className="lab-console-body">{output || '(nothing printed yet — press Run)'}</pre>
          {errorText && <div className="lab-error">⚠️ {errorText}</div>}
        </div>

        {phase === 'success' && (
          <div className="lab-success">
            <div>✅ The terminal lights up green — mission complete! +{mission.rewardXp} XP, +{mission.rewardCoins} coins.</div>
            <div className="lab-success-actions">
              <button className="lab-btn lab-btn-primary" onClick={handleContinue}>Continue exploring →</button>
              {onBackToMap && (
                <button className="lab-btn" onClick={onBackToMap}>Back to World Map</button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
