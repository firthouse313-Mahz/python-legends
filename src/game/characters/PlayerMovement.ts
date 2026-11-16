import { Scene, Vector3 } from '@babylonjs/core';
import { InputManager } from '../controls/InputManager';
import { RobotCharacter } from './RobotCharacter';

const WALK_SPEED = 3.2;
const RUN_SPEED = 6.4;
const TURN_SPEED = 10; // rad/s smoothing
const GRAVITY = -18;
const JUMP_VELOCITY = 6.2;
const GROUND_Y = 0;

export class PlayerMovement {
  facing = 0; // yaw, radians
  private velocityY = 0;
  private grounded = true;
  moving = false;
  running = false;
  private scene: Scene;
  private character: RobotCharacter;
  private input: InputManager;
  private cameraYawProvider: () => number;

  constructor(scene: Scene, character: RobotCharacter, input: InputManager, cameraYawProvider: () => number) {
    this.scene = scene;
    this.character = character;
    this.input = input;
    this.cameraYawProvider = cameraYawProvider;
  }

  update(dt: number) {
    const s = this.input.state;
    const camYaw = this.cameraYawProvider();

    // Build a movement vector in camera space, then rotate into world space,
    // so "forward" always means "away from the camera" (standard 3rd-person feel).
    let mx = (s.right ? 1 : 0) - (s.left ? 1 : 0);
    let mz = (s.forward ? 1 : 0) - (s.back ? 1 : 0);
    const len = Math.hypot(mx, mz);
    this.moving = len > 0.001;
    this.running = s.run && this.moving;

    let worldX = 0;
    let worldZ = 0;
    if (this.moving) {
      mx /= len;
      mz /= len;
      worldX = mx * Math.cos(camYaw) + mz * Math.sin(camYaw);
      worldZ = mz * Math.cos(camYaw) - mx * Math.sin(camYaw);

      const targetYaw = Math.atan2(worldX, worldZ);
      // Shortest-path angle smoothing.
      let diff = targetYaw - this.facing;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      this.facing += diff * Math.min(1, dt * TURN_SPEED);
    }

    // Jump + gravity
    if (this.grounded && this.input.consumeJump()) {
      this.velocityY = JUMP_VELOCITY;
      this.grounded = false;
    } else {
      this.input.consumeJump(); // discard if not grounded
    }

    this.velocityY += GRAVITY * dt;

    const speed = this.running ? RUN_SPEED : WALK_SPEED;
    const root = this.character.root;
    const wasAirborne = !this.grounded;
    // Combine horizontal movement + vertical gravity/jump into a single
    // displacement and let Babylon's collision system resolve it against
    // walls/trees/rocks/ground in one pass, instead of mutating .position
    // directly (which simply ignores checkCollisions on everything else).
    const displacement = new Vector3(worldX * speed * dt, this.velocityY * dt, worldZ * speed * dt);
    root.moveWithCollisions(displacement);

    // The only "floor" in this world is the single flat ground plane at
    // GROUND_Y — there's nothing else in Prompt 1's scene to stand on top
    // of — so a simple clamp is enough to turn the collision-resolved
    // position back into "landed" state (the collision engine itself keeps
    // the ellipsoid from sinking through the ground mesh; this clamp is a
    // safety net plus the moment we flip `grounded` back on).
    if (root.position.y <= GROUND_Y) {
      root.position.y = GROUND_Y;
      if (wasAirborne) {
        this.character.pulseScale(this.scene);
      }
      this.velocityY = 0;
      this.grounded = true;
    } else {
      this.grounded = false;
    }

    root.rotation.y = this.facing;
    this.character.animate(dt, this.moving, this.running);
  }

  get position(): Vector3 {
    return this.character.root.position;
  }
}
