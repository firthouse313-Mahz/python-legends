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
type InitRequest = { kind: 'init' };
type Incoming = RunRequest | InitRequest;

type Outgoing =
  | { kind: 'ready' }
  | { kind: 'init-error'; message: string }
  | { kind: 'result'; id: number; stdout: string; stderr: string; ok: true }
  | { kind: 'result'; id: number; stdout: string; stderr: string; ok: false; error: string };

let pyodideReady: Promise<any> | null = null;

// This is a CLASSIC (non-module) worker specifically so we can use
// importScripts() to load Pyodide's UMD-style build. That build sets a
// plain global (`loadPyodide`) rather than needing an ES module import,
// which sidesteps the dev-server/bundler rewriting a dynamic import() of a
// /public file. The actual runtime files (pyodide.js, the .wasm, the stdlib
// zip) are served as-is from /pyodide/ — copied from the `pyodide` npm
// package at build time (see public/pyodide/ and the project README) —
// not fetched from any third-party CDN.
declare function importScripts(...urls: string[]): void;

async function getPyodide() {
  if (!pyodideReady) {
    pyodideReady = (async () => {
      // BASE_URL respects the Vite `base` config (e.g. "/python-legends/"
      // on GitHub Pages, "/" in local dev) so these absolute-looking paths
      // still resolve correctly once this is served from a subpath.
      const base = (import.meta as any).env?.BASE_URL ?? '/';
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
      await getPyodide();
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
      const pyodide = await getPyodide();
      pyodide.setStdout({ batched: (s: string) => (stdout += s + '\n') });
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
      (self as any).postMessage({ kind: 'result', id: msg.id, stdout, stderr, ok: true } satisfies Outgoing);
    } catch (err: any) {
      const message = err?.message ? String(err.message) : String(err);
      (self as any).postMessage({ kind: 'result', id: msg.id, stdout, stderr, ok: false, error: message } satisfies Outgoing);
    }
  }
};
