// Minimal input manager for the runner: jump and slide, keyboard + touch.
// Deliberately tiny compared to the free-roam InputManager — there's no
// steering, since the player auto-runs forward.

type Listener = () => void;

export class RunnerControls {
  private jumpListeners = new Set<Listener>();
  private slideListeners = new Set<Listener>();
  private keydownHandler: (e: KeyboardEvent) => void;

  constructor() {
    this.keydownHandler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing = !!target && (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT' || target.isContentEditable);
      if (typing) return;
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault();
        this.jump();
      } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        e.preventDefault();
        this.slide();
      }
    };
    window.addEventListener('keydown', this.keydownHandler);
  }

  onJump(listener: Listener): () => void {
    this.jumpListeners.add(listener);
    return () => this.jumpListeners.delete(listener);
  }

  onSlide(listener: Listener): () => void {
    this.slideListeners.add(listener);
    return () => this.slideListeners.delete(listener);
  }

  /** Called by keyboard, or by the touch JUMP button. */
  jump() {
    this.jumpListeners.forEach((l) => l());
  }

  /** Called by keyboard, or by the touch SLIDE button. */
  slide() {
    this.slideListeners.forEach((l) => l());
  }

  dispose() {
    window.removeEventListener('keydown', this.keydownHandler);
    this.jumpListeners.clear();
    this.slideListeners.clear();
  }
}
