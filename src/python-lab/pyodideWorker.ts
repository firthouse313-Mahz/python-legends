// Runs student Python code using a real Pyodide (CPython-via-WebAssembly)
// runtime, entirely inside this Web Worker — never on the main thread, and
// never via any hard-coded/simulated output.
//
// The runtime files are served from /pyodide/ (copied from the `pyodide`
// npm package at build time — see public/pyodide/) rather than fetched from
// a third-party CDN, so this also works offline once cached by the service
// worker and doesn't depend on any external host being reachable.

/// <reference lib="webworker" />

type RunRequest = { kind: 'run'; id: number; code: string; providedInputs?: string[] };
type InitRequest = { kind: 'init'; base: string };
type Incoming = RunRequest | InitRequest;

type Outgoing =
  | { kind: 'ready' }
  | { kind: 'init-error'; message: string }
  | { kind: 'result'; id: number; stdout: string; stderr: string; ok: true }
  | { kind: 'result'; id: number; stdout: string; stderr: string; ok: false; error: string };

let pyodideReady: Promise<any> | null = null;

// A resource limit independent of the main-thread run-timeout: a runaway
// print loop (print in a tight for/while loop) would otherwise grow stdout
// without bound until the timeout fires, sending a huge postMessage payload
// and bogging down the console UI. Cut it off early with a clear message.
const MAX_OUTPUT_CHARS = 20000;

// Turns Pyodide's raw Python traceback text into a short, student-friendly
// hint, without just revealing the fix. The brief asks for runtime errors
// "explained in student-friendly language without simply revealing every
// answer" — this prepends a one-line plain-English gloss of the exception
// type; the original traceback stays visible underneath for anyone who
// wants the detail.
const FRIENDLY_ERRORS: Array<{ match: RegExp; hint: string }> = [
  { match: /NameError: name '(\w+)' is not defined/, hint: "Python doesn't recognise one of your variable or function names — check the spelling, and make sure it's assigned before you use it." },
  { match: /SyntaxError/, hint: 'There’s a typo in how the code is written — a missing colon, bracket, or quote is the usual cause.' },
  { match: /IndentationError/, hint: 'Python cares about spacing — lines inside the same block need exactly the same indentation.' },
  { match: /ZeroDivisionError/, hint: 'The code tried to divide a number by zero, which Python never allows.' },
  { match: /TypeError:.*concatenate/, hint: 'You likely tried to join text and a number directly — convert the number with str() first.' },
  { match: /TypeError/, hint: 'An operation was used on a type of value it doesn’t support — check what type() each variable actually is.' },
  { match: /ValueError:.*invalid literal for int/, hint: 'int() was given text that isn’t a whole number — check what you’re converting.' },
  { match: /ValueError/, hint: 'A value was the right type but not a valid one for what the code tried to do with it.' },
  { match: /IndexError/, hint: 'The code tried to reach a position in a list/string that doesn’t exist — check its length.' },
  { match: /KeyError/, hint: 'The code looked up a dictionary key that isn’t there.' },
  { match: /EOFError: No more input available/, hint: 'The code called input() more times than this mission supplies answers for.' },
];

function friendlyError(raw: string): string {
  for (const { match, hint } of FRIENDLY_ERRORS) {
    if (match.test(raw)) return `${hint}\n\n${raw}`;
  }
  return raw;
}

// This is a CLASSIC (non-module) worker specifically so we can use
// importScripts() to load Pyodide's UMD-style build. That build sets a
// plain global (`loadPyodide`) rather than needing an ES module import,
// which sidesteps the dev-server/bundler rewriting a dynamic import() of a
// /public file. The actual runtime files (pyodide.js, the .wasm, the stdlib
// zip) are served as-is from /pyodide/ — copied from the `pyodide` npm
// package at build time (see public/pyodide/ and the project README) —
// not fetched from any third-party CDN.
declare function importScripts(...urls: string[]): void;

async function getPyodide(base: string) {
  if (!pyodideReady) {
    pyodideReady = (async () => {
      // `base` is computed on the main thread (see PyodideRunner.spawnWorker)
      // and respects the Vite `base` config (e.g. "/python-legends/" on
      // GitHub Pages, "/" in local dev), so these paths still resolve once
      // this is served from a subpath.
      importScripts(`${base}pyodide/pyodide.js`);
      const loadPyodide = (self as any).loadPyodide;
      const pyodide = await loadPyodide({ indexURL: `${base}pyodide/` });
      return pyodide;
    })();
  }
  return pyodideReady;
}

self.onmessage = async (ev: MessageEvent<Incoming>) => {
  const msg = ev.data;
  if (msg.kind === 'init') {
    try {
      await getPyodide(msg.base);
      (self as any).postMessage({ kind: 'ready' } satisfies Outgoing);
    } catch (err: any) {
      (self as any).postMessage({ kind: 'init-error', message: String(err?.message ?? err) } satisfies Outgoing);
    }
    return;
  }

  if (msg.kind === 'run') {
    let stdout = '';
    let stderr = '';
    try {
      // The 'run' message never arrives before 'init' has resolved (the
      // main thread awaits the 'ready' reply first), so pyodideReady is
      // always already set here and this base value is never actually used.
      const pyodide = await getPyodide('');
      let truncated = false;
      pyodide.setStdout({
        batched: (s: string) => {
          if (stdout.length > MAX_OUTPUT_CHARS) {
            truncated = true;
            return;
          }
          stdout += s + '\n';
        },
      });
      pyodide.setStderr({ batched: (s: string) => (stderr += s + '\n') });

      // Minimal, non-interactive input() support: missions can supply a
      // fixed list of answers up front. True interactive mid-run input()
      // needs cross-origin-isolated SharedArrayBuffer blocking and is a
      // known follow-up (see README "Known limitations").
      const inputs = msg.providedInputs ?? [];
      pyodide.globals.set('__dc_inputs', inputs);
      await pyodide.runPythonAsync(
        'import builtins\n' +
          '__dc_input_iter = iter(__dc_inputs)\n' +
          'def __dc_input(prompt=""):\n' +
          '    try:\n' +
          '        return next(__dc_input_iter)\n' +
          '    except StopIteration:\n' +
          '        raise EOFError("No more input available for input() in this mission")\n' +
          'builtins.input = __dc_input\n',
      );

      await pyodide.runPythonAsync(msg.code);
      if (truncated) {
        stdout += `\n[... output cut off after ${MAX_OUTPUT_CHARS} characters — this usually means a loop is printing far more than intended ...]\n`;
      }
      (self as any).postMessage({ kind: 'result', id: msg.id, stdout, stderr, ok: true } satisfies Outgoing);
    } catch (err: any) {
      const rawMessage = err?.message ? String(err.message) : String(err);
      (self as any).postMessage({ kind: 'result', id: msg.id, stdout, stderr, ok: false, error: friendlyError(rawMessage) } satisfies Outgoing);
    }
  }
};
