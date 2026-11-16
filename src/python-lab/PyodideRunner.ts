// Main-thread side of the Python sandbox: owns the worker, enforces an
// execution timeout by terminating + respawning the worker (a worker has no
// way to interrupt itself mid-CPU-bound-loop without cross-origin isolation,
// so the timeout is enforced here), and turns the worker's postMessage
// protocol into a simple promise-based `run()` call.

export interface RunResult {
  ok: boolean;
  stdout: string;
  stderr: string;
  error?: string;
  timedOut?: boolean;
}

const RUN_TIMEOUT_MS = 8000;

export class PyodideRunner {
  private worker: Worker | null = null;
  private ready = false;
  private readyWaiters: Array<() => void> = [];
  private nextId = 1;
  private pending = new Map<number, (r: RunResult) => void>();

  constructor() {
    this.spawnWorker();
  }

  private spawnWorker() {
    this.ready = false;
    this.worker = new Worker(new URL('./pyodideWorker.ts', import.meta.url));
    this.worker.onmessage = (ev) => this.handleMessage(ev.data);
    this.worker.onerror = (e) => {
      console.error('Python worker error', e);
    };
    this.worker.postMessage({ kind: 'init' });
  }

  private handleMessage(msg: any) {
    if (msg.kind === 'ready') {
      this.ready = true;
      this.readyWaiters.forEach((w) => w());
      this.readyWaiters = [];
    } else if (msg.kind === 'init-error') {
      console.error('Pyodide failed to load:', msg.message);
    } else if (msg.kind === 'result') {
      const resolve = this.pending.get(msg.id);
      if (resolve) {
        this.pending.delete(msg.id);
        resolve({ ok: msg.ok, stdout: msg.stdout, stderr: msg.stderr, error: msg.error });
      }
    }
  }

  async waitUntilReady(): Promise<void> {
    if (this.ready) return;
    return new Promise((resolve) => this.readyWaiters.push(resolve));
  }

  async run(code: string, providedInputs: string[] = []): Promise<RunResult> {
    await this.waitUntilReady();
    const id = this.nextId++;

    return new Promise<RunResult>((resolve) => {
      let settled = false;
      const timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        this.pending.delete(id);
        // The worker is likely stuck in a CPU-bound Python loop — kill it
        // and bring up a fresh one so the lab keeps working for the next run.
        this.worker?.terminate();
        this.spawnWorker();
        resolve({ ok: false, stdout: '', stderr: '', timedOut: true, error: 'Your program took too long to finish (possible infinite loop) and was stopped.' });
      }, RUN_TIMEOUT_MS);

      this.pending.set(id, (r) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(r);
      });

      this.worker!.postMessage({ kind: 'run', id, code, providedInputs });
    });
  }

  dispose() {
    this.worker?.terminate();
  }
}
