import { Scene, Vector3, Color3 } from '@babylonjs/core';
import { RobotCharacter, type RobotColors } from './RobotCharacter';

export const GUARDIAN_COLORS: RobotColors = {
  body: new Color3(0.14, 0.14, 0.2),
  accent: new Color3(1, 0.22, 0.5),
  visor: new Color3(1, 0.2, 0.4),
};

type GuardianState = 'dormant' | 'patrol' | 'chase' | 'cooldown';

/**
 * The Guardian Sentinel — a chaser enemy. Dormant until the player starts
 * charging the conduits (so there's no stakes until the player has
 * actually engaged with the challenge), then patrols the corridor in
 * front of the Vault Gate and switches to an active chase whenever the
 * player gets close. Catching the player costs energy and sends the
 * Guardian back to cool down — a real, escapable threat, not a hard
 * fail state.
 */
export class Guardian {
  character: RobotCharacter;
  state: GuardianState = 'dormant';
  private patrolA: Vector3;
  private patrolB: Vector3;
  private towardB = true;
  private speed = 3.4; // below the player's run speed, so running away works
  private cooldownTimer = 0;
  private chaseAggroRadius = 6.5;
  private chaseGiveUpRadius = 12;

  constructor(scene: Scene, patrolA: Vector3, patrolB: Vector3) {
    this.character = new RobotCharacter(scene, 'guardian', GUARDIAN_COLORS);
    // The Guardian must NOT be a solid obstacle for the player's own
    // moveWithCollisions: two dynamic colliders (player + Guardian) pressed
    // against a thin static wall (the Energy Gate) at the same time can
    // tunnel straight through it — found via testing, where the player
    // reached the terminal at only 80/100 energy because the Guardian
    // caught up right at the gate and shoved them through. Catching the
    // player is handled entirely by the distance check in isCatching(), so
    // the Guardian doesn't need real physical collision with anything.
    this.character.root.checkCollisions = false;
    this.patrolA = patrolA.clone();
    this.patrolB = patrolB.clone();
    this.character.root.position = patrolA.clone();
  }

  get position(): Vector3 {
    return this.character.root.position;
  }

  activate() {
    if (this.state === 'dormant') this.state = 'patrol';
  }

  update(dt: number, playerPos: Vector3) {
    if (this.state === 'dormant') {
      this.character.animate(dt, false, false);
      return;
    }
    if (this.state === 'cooldown') {
      this.cooldownTimer -= dt;
      this.character.animate(dt, false, false);
      if (this.cooldownTimer <= 0) this.state = 'patrol';
      return;
    }

    let target: Vector3;
    const distToPlayer = Vector3.Distance(this.position, playerPos);

    if (this.state === 'chase') {
      target = playerPos;
      if (distToPlayer > this.chaseGiveUpRadius) this.state = 'patrol';
    } else {
      const patrolTarget = this.towardB ? this.patrolB : this.patrolA;
      if (Vector3.Distance(this.position, patrolTarget) < 0.7) this.towardB = !this.towardB;
      target = this.towardB ? this.patrolB : this.patrolA;
      if (distToPlayer < this.chaseAggroRadius) this.state = 'chase';
    }

    const dir = target.subtract(this.position);
    dir.y = 0;
    const dist = dir.length();
    if (dist > 0.05) {
      dir.normalize();
      const moveDist = Math.min(dist, this.speed * dt);
      this.character.root.moveWithCollisions(dir.scale(moveDist));
      this.character.root.rotation.y = Math.atan2(dir.x, dir.z);
      this.character.animate(dt, true, this.state === 'chase');
    } else {
      this.character.animate(dt, false, false);
    }
  }

  isCatching(playerPos: Vector3, radius = 1.15): boolean {
    return this.state === 'chase' && Vector3.Distance(this.position, playerPos) < radius;
  }

  /** Caught the player: retreat to cool down for a few seconds. */
  zapAndRetreat() {
    this.state = 'cooldown';
    this.cooldownTimer = 3.5;
    this.character.root.position = this.patrolA.clone();
  }
}
