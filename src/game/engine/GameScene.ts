import { Engine, Scene, Vector3 } from '@babylonjs/core';
import { InputManager } from '../controls/InputManager';
import { RobotCharacter, PLAYER_COLORS } from '../characters/RobotCharacter';
import { PlayerMovement } from '../characters/PlayerMovement';
import { FollowCamera } from '../camera/FollowCamera';
import { VillageWorld } from '../world/VillageWorld';
import { Npc } from '../world/Npc';
import { CodeTerminal } from '../world/Terminal';

export interface GameCallbacks {
  onScoreChange: (score: number) => void;
  onNearNpc: (near: boolean) => void;
  onNearTerminal: (near: boolean) => void;
  onInteractNpc: () => void;
  onInteractTerminal: () => void;
}

export class GameScene {
  engine: Engine;
  scene: Scene;
  world: VillageWorld;
  input: InputManager;
  player: PlayerMovement;
  playerCharacter: RobotCharacter;
  camera: FollowCamera;
  npc: Npc;
  terminal: CodeTerminal;

  private score = 0;
  private running = true;
  private wasNearNpc = false;
  private wasNearTerminal = false;
  private resizeHandler = () => this.engine.resize();
  private callbacks: GameCallbacks;

  constructor(canvas: HTMLCanvasElement, callbacks: GameCallbacks, levelTopic: string) {
    this.callbacks = callbacks;
    this.engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
    this.scene = new Scene(this.engine);
    this.scene.collisionsEnabled = true;

    this.world = new VillageWorld(this.scene);

    this.input = new InputManager(canvas);

    this.playerCharacter = new RobotCharacter(this.scene, 'player', PLAYER_COLORS);
    this.playerCharacter.root.position = new Vector3(0, 0, -4);

    this.camera = new FollowCamera(this.scene, canvas, this.input, this.playerCharacter.root.position);
    // Orbit is driven entirely by InputManager's pointer-drag tracking (see
    // FollowCamera.update), so Babylon's own camera inputs stay cleared —
    // no attachControl() call needed. Scroll/pinch zoom is a nice-to-have
    // left for a later pass (noted in README known limitations).
    this.scene.activeCamera = this.camera.camera;

    this.player = new PlayerMovement(this.scene, this.playerCharacter, this.input, () => this.camera.yaw);

    this.npc = new Npc(this.scene, new Vector3(3, 0, -1), [
      'Welcome back to Python Village, explorer!',
      `This mission: ${levelTopic}.`,
      'Walk up to the glowing terminal and press USE (or E) when you’re ready.',
    ]);

    this.terminal = new CodeTerminal(this.scene, new Vector3(5, 0, -3));

    this.input.onInteract(() => this.checkInteract());

    window.addEventListener('resize', this.resizeHandler);

    this.engine.runRenderLoop(() => this.tick());
  }

  private checkInteract() {
    if (!this.running) return;
    const pos = this.player.position;
    if (this.npc.isNear(pos)) {
      this.callbacks.onInteractNpc();
    } else if (this.terminal.isNear(pos)) {
      this.callbacks.onInteractTerminal();
    }
  }

  /** Called by React when a touch "TALK/USE" button is tapped. */
  triggerInteract() {
    this.checkInteract();
  }

  private tick() {
    const dt = this.engine.getDeltaTime() / 1000;
    if (this.running) {
      this.player.update(dt);
      this.camera.update(this.player.position);
      this.world.animateCoins(dt);
      this.npc.update(dt, this.player.position);
      this.terminal.update(dt);
      this.checkCoinCollection();

      const nearNpc = this.npc.isNear(this.player.position);
      if (nearNpc !== this.wasNearNpc) {
        this.wasNearNpc = nearNpc;
        this.callbacks.onNearNpc(nearNpc);
      }
      const nearTerminal = this.terminal.isNear(this.player.position);
      if (nearTerminal !== this.wasNearTerminal) {
        this.wasNearTerminal = nearTerminal;
        this.callbacks.onNearTerminal(nearTerminal);
      }
    }
    this.scene.render();
  }

  private checkCoinCollection() {
    for (const coin of this.world.coins) {
      if (coin.collected) continue;
      if (Vector3.Distance(coin.mesh.position, this.player.position) < 0.9) {
        coin.collected = true;
        coin.mesh.setEnabled(false);
        this.score += 1;
        this.callbacks.onScoreChange(this.score);
      }
    }
  }

  markTerminalSolved() {
    this.terminal.markSolved();
    // The tangible payoff: a treasure chest actually pops open in the
    // world next to the terminal, not just a text banner — something the
    // player then has to go run over and collect.
    this.world.spawnTreasureChest(this.terminal.position.add(new Vector3(1.4, 0, 1.0)));
  }

  setPaused(paused: boolean) {
    this.running = !paused;
  }

  dispose() {
    window.removeEventListener('resize', this.resizeHandler);
    this.input.dispose();
    this.engine.dispose();
  }
}
