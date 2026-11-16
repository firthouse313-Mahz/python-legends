import { useEffect, useRef, useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import type { Mission, TestCase } from '../curriculum/missions';
import { progressService } from '../progress/progressService';
import { PyodideRunner } from './PyodideRunner';
import './python-lab.css';

interface Props {
  mission: Mission;
  runner: PyodideRunner;
  onClose: () => void;
  /** Called exactly once, the moment every test case first passes — this
   *  is where XP/coins/progress should actually be recorded, regardless
   *  of which button the student clicks next on the success panel. */
  onMissionComplete: () => void;
  /** "Continue exploring" — close the overlay and stay in the 3D scene. */
  onContinue: () => void;
  /** Optional: when provided, the success panel offers a second button
   *  that leaves the 3D scene and returns to the World Map hub. */
  onBackToMap?: () => void;
}

type Phase = 'loading' | 'predict' | 'idle' | 'running' | 'success' | 'failed';
type Mode = 'main' | 'debug';

export function PythonLabOverlay({ mission, runner, onClose, onMissionComplete, onContinue, onBackToMap }: Props) {
  const [mode, setMode] = useState<Mode>('main');
  const [code, setCode] = useState(mission.starterCode);
  const [output, setOutput] = useState('');
  const [errorText, setErrorText] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>('loading');
  const [predictChoice, setPredictChoice] = useState<number | null>(null);
  const [predictWrongTry, setPredictWrongTry] = useState(false);
  const bonusId = `${mission.id}-debug`;
  const [debugAlreadyDone, setDebugAlreadyDone] = useState(() => progressService.isBonusCompleted(bonusId));
  const succeededMain = useRef(false);
  const succeededDebug = useRef(false);

  useEffect(() => {
    let cancelled = false;
    runner.waitUntilReady().then(() => {
      if (cancelled) return;
      setPhase(mission.predict ? 'predict' : 'idle');
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runner]);

  function handlePredictChoice(index: number) {
    setPredictChoice(index);
    if (index === mission.predict!.correctIndex) {
      setPredictWrongTry(false);
    } else {
      setPredictWrongTry(true);
    }
  }

  function handlePredictContinue() {
    setPhase('idle');
  }

  async function handleRun() {
    setPhase('running');
    setErrorText(null);

    const testCases: TestCase[] = mode === 'main' ? [{}, ...(mission.hiddenTestCases ?? [])] : [{}];
    const defaultInputs = mode === 'main' ? mission.providedInputs ?? [] : [];

    let lastOutput = '';
    for (const testCase of testCases) {
      const effectiveInputs = testCase.providedInputs ?? defaultInputs;
      const result = await runner.run(code, effectiveInputs);
      if (testCase.providedInputs === undefined) {
        // The visible/default case is the one we actually show in the console.
        lastOutput = result.stdout;
        setOutput(result.stdout);
      }
      if (!result.ok) {
        setErrorText(result.error ?? 'Something went wrong running your code.');
        setPhase('failed');
        return;
      }
      const failure =
        mode === 'main' ? mission.check(result.stdout, code, testCase) : mission.debugChallenge!.check(result.stdout, code);
      if (failure) {
        setErrorText(failure);
        setPhase('failed');
        return;
      }
    }

    setOutput(lastOutput);
    setPhase('success');
    if (mode === 'main' && !succeededMain.current) {
      succeededMain.current = true;
      onMissionComplete();
    } else if (mode === 'debug' && !succeededDebug.current) {
      succeededDebug.current = true;
      progressService.completeBonus(bonusId, mission.debugChallenge!.rewardXp, mission.debugChallenge!.rewardCoins);
      setDebugAlreadyDone(true);
    }
  }

  function handleReset() {
    setCode(mode === 'main' ? mission.starterCode : mission.debugChallenge!.buggyCode);
    setOutput('');
    setErrorText(null);
    setPhase('idle');
  }

  function handleClear() {
    setOutput('');
    setErrorText(null);
  }

  function startDebugChallenge() {
    setMode('debug');
    setCode(mission.debugChallenge!.buggyCode);
    setOutput('');
    setErrorText(null);
    setPhase('idle');
  }

  const predict = mission.predict;

  return (
    <div className="lab-overlay" data-ui>
      <div className="lab-panel">
        <header className="lab-header">
          <h2>🖥️ {mode === 'main' ? mission.title : `Bonus: Debug It!`}</h2>
          <button className="lab-close" onClick={onClose} aria-label="Close">✕</button>
        </header>

        {phase === 'predict' && predict ? (
          <div className="lab-predict">
            <p className="lab-story">{predict.prompt}</p>
            <pre className="lab-predict-snippet">{predict.snippet}</pre>
            <div className="lab-predict-options">
              {predict.options.map((opt, i) => (
                <button
                  key={i}
                  className={`lab-predict-option ${predictChoice === i ? (i === predict.correctIndex ? 'correct' : 'wrong') : ''}`}
                  onClick={() => handlePredictChoice(i)}
                >
                  {opt}
                </button>
              ))}
            </div>
            {predictChoice !== null && predictChoice === predict.correctIndex && (
              <div className="lab-predict-feedback correct">
                ✅ {predict.explanation}
                <button className="lab-btn lab-btn-primary" onClick={handlePredictContinue}>
                  Continue to the code →
                </button>
              </div>
            )}
            {predictWrongTry && predictChoice !== predict.correctIndex && (
              <div className="lab-predict-feedback wrong">Not quite — look again and pick another answer.</div>
            )}
          </div>
        ) : (
          <>
            <p className="lab-story">{mode === 'main' ? mission.story : mission.debugChallenge!.intro}</p>
            {mode === 'debug' && <p className="lab-hint">💡 Hint: {mission.debugChallenge!.hint}</p>}

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

            {phase === 'success' && mode === 'main' && (
              <div className="lab-success">
                <div>✅ The terminal lights up green — mission complete! +{mission.rewardXp} XP, +{mission.rewardCoins} coins.</div>
                <div className="lab-success-actions">
                  <button className="lab-btn lab-btn-primary" onClick={onContinue}>Continue exploring →</button>
                  {mission.debugChallenge && !debugAlreadyDone && (
                    <button className="lab-btn" onClick={startDebugChallenge}>🐞 Bonus: Debug Challenge</button>
                  )}
                  {onBackToMap && (
                    <button className="lab-btn" onClick={onBackToMap}>Back to World Map</button>
                  )}
                </div>
              </div>
            )}

            {phase === 'success' && mode === 'debug' && (
              <div className="lab-success">
                <div>
                  🐞✅ Bug squashed! +{mission.debugChallenge!.rewardXp} XP, +{mission.debugChallenge!.rewardCoins} coins.
                </div>
                <div className="lab-success-actions">
                  <button className="lab-btn lab-btn-primary" onClick={onContinue}>Continue exploring →</button>
                  {onBackToMap && (
                    <button className="lab-btn" onClick={onBackToMap}>Back to World Map</button>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
