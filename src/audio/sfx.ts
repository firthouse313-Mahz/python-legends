// A tiny, dependency-free sound engine. Every effect here is synthesized
// on the fly with the Web Audio API (oscillators + gain envelopes) —
// there are no audio asset files to fetch, which matters in this sandbox
// (no network access to download sound libraries) and keeps the whole
// game loadable from one self-contained bundle.
//
// Browsers block audio output until a real user gesture happens on the
// page, so `unlock()` must be called from a click/keydown handler before
// any sound will actually be audible — App.tsx wires that up once, on
// the very first interaction.

type Ctor = typeof AudioContext;

class SfxEngine {
  private ctx: AudioContext | null = null;
  private muted: boolean;
  private ambientTimer: number | null = null;
  private ambientStep = 0;

  constructor() {
    this.muted = (() => {
      try {
        return localStorage.getItem('python-legends:muted') === '1';
      } catch {
        return false;
      }
    })();
  }

  private ensureCtx(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtor: Ctor | undefined = window.AudioContext ?? (window as any).webkitAudioContext;
      if (!AudioCtor) return null;
      this.ctx = new AudioCtor();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
    return this.ctx;
  }

  /** Call once, from the very first click/keydown on the page. */
  unlock() {
    this.ensureCtx();
  }

  get isMuted() {
    return this.muted;
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    try {
      localStorage.setItem('python-legends:muted', muted ? '1' : '0');
    } catch {
      // Best-effort only.
    }
    if (muted) this.stopAmbient();
  }

  toggleMute(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  private tone(freq: number, startTime: number, duration: number, type: OscillatorType, peak: number, ctx: AudioContext) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(peak, startTime + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.02);
  }

  private sweep(freqFrom: number, freqTo: number, startTime: number, duration: number, type: OscillatorType, peak: number, ctx: AudioContext) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freqFrom, startTime);
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, freqTo), startTime + duration);
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(peak, startTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.02);
  }

  playCoin() {
    if (this.muted) return;
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    this.tone(880, t, 0.09, 'square', 0.12, ctx);
    this.tone(1320, t + 0.055, 0.12, 'square', 0.1, ctx);
  }

  playJump() {
    if (this.muted) return;
    const ctx = this.ensureCtx();
    if (!ctx) return;
    this.sweep(300, 760, ctx.currentTime, 0.12, 'triangle', 0.12, ctx);
  }

  playClick() {
    if (this.muted) return;
    const ctx = this.ensureCtx();
    if (!ctx) return;
    this.tone(520, ctx.currentTime, 0.05, 'square', 0.07, ctx);
  }

  /** Light positive feedback — a predict answer, or one Run passing. */
  playSuccess() {
    if (this.muted) return;
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    [523, 659, 784].forEach((f, i) => this.tone(f, t + i * 0.08, 0.16, 'triangle', 0.13, ctx));
  }

  /** A wrong predict answer, or Run failing. */
  playError() {
    if (this.muted) return;
    const ctx = this.ensureCtx();
    if (!ctx) return;
    this.sweep(320, 110, ctx.currentTime, 0.28, 'sawtooth', 0.11, ctx);
  }

  /** An Energy Conduit charges. */
  playPowerUp() {
    if (this.muted) return;
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    [392, 523, 659, 784].forEach((f, i) => this.tone(f, t + i * 0.06, 0.18, 'square', 0.13, ctx));
  }

  /** The Vault Gate opens. */
  playUnlock() {
    if (this.muted) return;
    const ctx = this.ensureCtx();
    if (!ctx) return;
    this.sweep(220, 1500, ctx.currentTime, 0.5, 'sawtooth', 0.09, ctx);
  }

  /** The Guardian catches the player. */
  playZap() {
    if (this.muted) return;
    const ctx = this.ensureCtx();
    if (!ctx) return;
    this.sweep(900, 90, ctx.currentTime, 0.22, 'sawtooth', 0.15, ctx);
  }

  /** The Guardian spots the player and starts chasing — a short alert stinger. */
  playChase() {
    if (this.muted) return;
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    this.tone(660, t, 0.1, 'square', 0.14, ctx);
    this.tone(660, t + 0.16, 0.12, 'square', 0.14, ctx);
  }

  /** A whole level's main mission is solved — the big fanfare. */
  playComplete() {
    if (this.muted) return;
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    [523, 659, 784, 1046].forEach((f, i) => this.tone(f, t + i * 0.1, 0.22, 'triangle', 0.15, ctx));
  }

  /** A soft, sparse ambient loop while playing — subtle, never a full track. */
  startAmbient() {
    if (this.muted || this.ambientTimer !== null) return;
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const notes = [392, 440, 523, 440];
    const step = () => {
      if (this.muted) return;
      const c = this.ensureCtx();
      if (!c) return;
      const f = notes[this.ambientStep % notes.length];
      this.tone(f, c.currentTime, 1.3, 'sine', 0.03, c);
      this.ambientStep++;
    };
    step();
    this.ambientTimer = window.setInterval(step, 1700);
  }

  stopAmbient() {
    if (this.ambientTimer !== null) {
      window.clearInterval(this.ambientTimer);
      this.ambientTimer = null;
    }
  }
}

export const sfx = new SfxEngine();
