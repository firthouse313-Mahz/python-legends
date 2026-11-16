import { useEffect, useRef, useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import type { Mission } from '../game/missions/mission1';
import { PyodideRunner } from './PyodideRunner';
import './python-lab.css';

interface Props {
  mission: Mission;
  runner: PyodideRunner;
  onClose: () => void;
  onSuccess: () => void;
}

type Phase = 'loading' | 'idle' | 'running' | 'success' | 'failed';

export function PythonLabOverlay({ mission, runner, onClose, onSuccess }: Props) {
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
    const result = await runner.run(code);
    setOutput(result.stdout);
    if (!result.ok) {
      setErrorText(result.error ?? 'Something went wrong running your code.');
      setPhase('failed');
      return;
    }
    const failure = mission.check(result.stdout);
    if (failure) {
      setErrorText(failure);
      setPhase('failed');
    } else {
      setPhase('success');
      succeeded.current = true;
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
    onSuccess();
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
            <button className="lab-btn lab-btn-primary" onClick={handleContinue}>Continue exploring →</button>
          </div>
        )}
      </div>
    </div>
  );
}
