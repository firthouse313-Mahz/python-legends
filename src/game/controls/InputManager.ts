// Unified input state for keyboard + touch/mobile virtual controls.
// The rest of the game only ever reads `InputManager.state`; it never
// needs to know whether a given input came from a key or a touch button.

export interface InputState {
  forward: boolean;
  back: boolean;
  left: boolean;
  right: boolean;
  run: boolean;
  jump: boolean; // edge-triggered: true for one frame only, see consumeJump()
  interact: boolean; // edge-triggered
}

type Listener = () => void;

export class InputManager {
  state: InputState = {
    forward: false,
    back: false,
    left: false,
    right: false,
    run: false,
    jump: false,
    interact: false,
  };

  // Camera orbit drag delta (set by pointer drag on the canvas or the touch
  // look-pad), consumed once per frame by the follow camera.
  lookDeltaX = 0;
  lookDeltaY = 0;

  private jumpQueued = false;
  private interactQueued = false;
  private keyDownHandler: (e: KeyboardEvent) => void;
  private keyUpHandler: (e: KeyboardEvent) => void;
  private interactListeners: Listener[] = [];

  constructor(target: HTMLElement) {
    this.keyDownHandler = (e) => this.onKey(e, true);
    this.keyUpHandler = (e) => this.onKey(e, false);
    window.addEventListener('keydown', this.keyDownHandler);
    window.addEventListener('keyup', this.keyUpHandler);

    // Desktop mouse-drag camera orbit (right mouse button or primary drag
    // when not clicking a UI element).
    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    target.addEventListener('pointerdown', (e) => {
      if ((e.target as HTMLElement).closest('[data-ui]')) return;
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
    });
    window.addEventListener('pointerup', () => (dragging = false));
    window.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      this.lookDeltaX += e.clientX - lastX;
      this.lookDeltaY += e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
    });
  }

  private onKey(e: KeyboardEvent, down: boolean) {
    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.state.forward = down;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.state.back = down;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.state.left = down;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.state.right = down;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.state.run = down;
        break;
      case 'Space':
        if (down) this.jumpQueued = true;
        e.preventDefault();
        break;
      case 'KeyE':
        if (down) {
          this.interactQueued = true;
          this.interactListeners.forEach((l) => l());
        }
        break;
    }
  }

  /** Called by touch joystick: normalised vector, magnitude 0..1. */
  setMoveVector(x: number, y: number) {
    const dead = 0.15;
    this.state.forward = y < -dead;
    this.state.back = y > dead;
    this.state.left = x < -dead;
    this.state.right = x > dead;
  }

  setRun(on: boolean) {
    this.state.run = on;
  }

  queueJump() {
    this.jumpQueued = true;
  }

  queueInteract() {
    this.interactQueued = true;
    this.interactListeners.forEach((l) => l());
  }

  onInteract(listener: Listener) {
    this.interactListeners.push(listener);
  }

  /** Call once per frame: returns true exactly once per press. */
  consumeJump(): boolean {
    if (this.jumpQueued) {
      this.jumpQueued = false;
      return true;
    }
    return false;
  }

  consumeInteract(): boolean {
    if (this.interactQueued) {
      this.interactQueued = false;
      return true;
    }
    return false;
  }

  consumeLook(): { x: number; y: number } {
    const d = { x: this.lookDeltaX, y: this.lookDeltaY };
    this.lookDeltaX = 0;
    this.lookDeltaY = 0;
    return d;
  }

  dispose() {
    window.removeEventListener('keydown', this.keyDownHandler);
    window.removeEventListener('keyup', this.keyUpHandler);
  }
}
