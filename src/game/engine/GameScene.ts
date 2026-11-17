import { Engine, Scene, Vector3 } from '@babylonjs/core';
import { InputManager } from '../controls/InputManager';
import { RobotCharacter, PLAYER_COLORS } from '../characters/RobotCharacter';
import { PlayerMovement } from '../characters/PlayerMovement';
import { Guardian } from '../characters/Guardian';
import { FollowCamera } from '../camera/FollowCamera';
import { VillageWorld } from '../world/VillageWorld';
import { Npc } from '../world/Npc';
import { CodeTerminal } from '../world/Terminal';
import { EnergyConduit } from '../world/EnergyConduit';
import { EnergyGate } from '../world/EnergyGate';
import { sfx } from '../../audio/sfx';

export const ENERGY_GATE_THRESHOLD = 100;
export const ENERGY_ZAP_PENALTY = 20;

export interface GameCallbacks {
  onScoreChange: (score: number) => void;
  onNearNpc: (near: boolean) => void;
  onNearTerminal: (near: boolean) => void;
  onInteractNpc: () => void;
  onInteractTerminal: () => void;
  /** Only fired for the hurdle level: near/interact with an energy conduit. */
  onNearConduit: (near: boolean) => void;
  onInteractConduit: (index: number) => void;
  onEnergyChange: (energy: number) => void;
  onGateOpen: () => void;
  onZapped: () => void;
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
  conduits: EnergyConduit[] = [];
  gate: EnergyGate | null = null;
  guardian: Guardian | null = null;
  readonly isHurdleLevel: boolean;
  energy = 0;

  private score = 0;
  private running = true;
  private wasNearNpc = false;
  private wasNearTerminal = false;
  private wasNearConduit = false;
  private resizeHandler = () => this.engine.resize();
  private callbacks: GameCallbacks;

  constructor(canvas: HTMLCanvasElement, callbacks: GameCallbacks, levelTopic: string, levelId?: string) {
    this.callbacks = callbacks;
    this.isHurdleLevel = levelId === 'w1-l1';
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

    this.npc = new Npc(
      this.scene,
      new Vector3(3, 0, -1),
      this.isHurdleLevel
        ? [
            'Welcome to Python Village! This terminal is sealed behind the Vault Gate.',
            'Find both glowing Energy Conduits and solve their Python to charge it open.',
            'Careful — once you start, the Guardian Sentinel will patrol nearby. Getting caught costs you energy!',
          ]
        : [
            'Welcome back to Python Village, explorer!',
            `This mission: ${levelTopic}.`,
            'Walk up to the glowing terminal and press USE (or E) when you’re ready.',
          ],
    );

    this.terminal = new CodeTerminal(this.scene, this.isHurdleLevel ? new Vector3(3, 0, -11) : new Vector3(5, 0, -3));

    if (this.isHurdleLevel) {
      this.conduits = [
        new EnergyConduit(this.scene, new Vector3(-8, 0, -6)),
        new EnergyConduit(this.scene, new Vector3(9, 0, -5)),
      ];
      // Spans the full width between the boundary walls (bounds = 14, so
      // the map is 28 wide) with a little overlap past each wall — there
      // must be NO gap at either end, or the player can just walk around
      // the "hurdle" instead of earning their way past it.
      this.gate = new EnergyGate(this.scene, new Vector3(0, 0, -7.5), 30);
      this.guardian = new Guardian(this.scene, new Vector3(6, 0, -9), new Vector3(-4, 0, -9));
      // Level 1's Guardian only wakes up once the player earns it, by
      // solving the first conduit (see markConduitSolved below).
    } else {
      // Every other World-1 level keeps the same threat alive, lighter
      // touch: no conduits/gate puzzle (the level's own terminal mission
      // IS the Python challenge), just a Guardian patrolling near the
      // terminal and NPC, live and chasing from the moment the level
      // starts — so every level has some real motion/stakes, not just
      // Level 1. Getting caught costs a couple of coins and a jolt
      // instead of energy (there's no energy bar outside the hurdle
      // level), and never blocks reaching the terminal.
      // Patrol line kept a few extra units south of the spawn point (0,-4)
      // so the Guardian doesn't ambush the player in their very first
      // second before they've had a chance to move — it still patrols
      // right across the path to the terminal/NPC.
      this.guardian = new Guardian(this.scene, new Vector3(9, 0, -8), new Vector3(-4, 0, -8));
      this.guardian.activate();
    }

    this.input.onInteract(() => this.checkInteract());

    window.addEventListener('resize', this.resizeHandler);

    this.engine.runRenderLoop(() => this.tick());
  }

  private checkInteract() {
    if (!this.running) return;
    const pos = this.player.position;
    if (this.npc.isNear(pos)) {
      this.callbacks.onInteractNpc();
      return;
    }
    for (let i = 0; i < this.conduits.length; i++) {
      if (!this.conduits[i].solved && this.conduits[i].isNear(pos)) {
        this.callbacks.onInteractConduit(i);
        return;
      }
    }
    if (this.terminal.isNear(pos)) {
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

      for (const conduit of this.conduits) conduit.update(dt);
      if (this.gate) this.gate.update(dt, this.energy / ENERGY_GATE_THRESHOLD);
      if (this.guardian) {
        const wasChasing = this.guardian.state === 'chase';
        this.guardian.update(dt, this.player.position);
        if (this.guardian.state === 'chase' && !wasChasing) sfx.playChase();
        if (this.guardian.isCatching(this.player.position)) {
          this.guardian.zapAndRetreat();
          sfx.playZap();
          if (this.isHurdleLevel) {
            this.energy = Math.max(0, this.energy - ENERGY_ZAP_PENALTY);
            this.callbacks.onEnergyChange(this.energy);
          } else {
            this.score = Math.max(0, this.score - 2);
            this.callbacks.onScoreChange(this.score);
          }
          this.callbacks.onZapped();
        }
      }

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
      const nearConduit = this.conduits.some((c) => !c.solved && c.isNear(this.player.position));
      if (nearConduit !== this.wasNearConduit) {
        this.wasNearConduit = nearConduit;
        this.callbacks.onNearConduit(nearConduit);
      }
    }
    this.scene.render();
  }

  /** Called by React once a conduit's Python challenge has been solved. */
  markConduitSolved(index: number) {
    const conduit = this.conduits[index];
    if (!conduit || conduit.solved) return;
    conduit.markSolved();
    sfx.playPowerUp();
    this.guardian?.activate();
    this.energy = Math.min(ENERGY_GATE_THRESHOLD, this.energy + 50);
    this.callbacks.onEnergyChange(this.energy);
    if (this.energy >= ENERGY_GATE_THRESHOLD && this.gate && !this.gate.isOpen) {
      this.gate.open();
      sfx.playUnlock();
      this.callbacks.onGateOpen();
    }
  }

  private checkCoinCollection() {
    for (const coin of this.world.coins) {
      if (coin.collected) continue;
      if (Vector3.Distance(coin.mesh.position, this.player.position) < 0.9) {
        coin.collected = true;
        coin.mesh.setEnabled(false);
        this.score += 1;
        sfx.playCoin();
        this.callbacks.onScoreChange(this.score);
      }
    }
  }

  markTerminalSolved() {
    this.terminal.markSolved();
    sfx.playComplete();
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
