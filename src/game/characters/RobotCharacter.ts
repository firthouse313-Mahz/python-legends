import {
  Color3,
  Mesh,
  MeshBuilder,
  Scene,
  StandardMaterial,
  Vector3,
} from '@babylonjs/core';

export interface RobotColors {
  body: Color3;
  accent: Color3;
  visor: Color3;
}

export const PLAYER_COLORS: RobotColors = {
  body: new Color3(0.86, 0.89, 0.95),
  accent: new Color3(0.2, 0.75, 0.95),
  visor: new Color3(0.15, 0.95, 0.85),
};

export const NPC_COLORS: RobotColors = {
  body: new Color3(0.95, 0.85, 0.55),
  accent: new Color3(0.9, 0.45, 0.2),
  visor: new Color3(1, 0.9, 0.3),
};

/**
 * A small, friendly, entirely original low-poly "explorer robot" built
 * from primitive meshes only (no external models/assets). Exposes a few
 * named limb nodes so a walk-cycle can animate them procedurally.
 */
export class RobotCharacter {
  /** Invisible collider mesh. Move it with `root.moveWithCollisions(...)`
   *  (not by poking `.position` directly) so walls/scenery/the world
   *  boundary actually stop the character instead of being walked through. */
  root: Mesh;
  private head: Mesh;
  private armL: Mesh;
  private armR: Mesh;
  private legL: Mesh;
  private legR: Mesh;
  private torso: Mesh;
  private walkPhase = 0;
  private bodyMat: StandardMaterial;

  constructor(scene: Scene, name: string, colors: RobotColors) {
    const collider = MeshBuilder.CreateBox(`${name}-root`, { width: 0.001, height: 0.001, depth: 0.001 }, scene);
    collider.isVisible = false;
    collider.checkCollisions = true;
    // Capsule-shaped collision volume standing on the ground at y=0, roughly
    // matching the visible robot's size (it's ~1.8 tall including antenna).
    collider.ellipsoid = new Vector3(0.34, 0.86, 0.34);
    collider.ellipsoidOffset = new Vector3(0, 0.86, 0);
    this.root = collider;

    const bodyMat = new StandardMaterial(`${name}-bodyMat`, scene);
    bodyMat.diffuseColor = colors.body;
    bodyMat.specularColor = new Color3(0.2, 0.2, 0.2);
    this.bodyMat = bodyMat;

    const accentMat = new StandardMaterial(`${name}-accentMat`, scene);
    accentMat.diffuseColor = colors.accent;
    accentMat.emissiveColor = colors.accent.scale(0.25);

    const visorMat = new StandardMaterial(`${name}-visorMat`, scene);
    visorMat.diffuseColor = colors.visor;
    visorMat.emissiveColor = colors.visor.scale(0.85);

    // Torso
    const torso = MeshBuilder.CreateBox(`${name}-torso`, { width: 0.62, height: 0.74, depth: 0.4 }, scene);
    torso.position.y = 1.02;
    torso.material = bodyMat;
    torso.parent = this.root;
    this.torso = torso;

    const chestLight = MeshBuilder.CreateCylinder(`${name}-chest`, { diameter: 0.18, height: 0.06, tessellation: 16 }, scene);
    chestLight.rotation.x = Math.PI / 2;
    chestLight.position.set(0, 0.08, -0.21);
    chestLight.material = accentMat;
    chestLight.parent = torso;

    // Head
    const head = MeshBuilder.CreateBox(`${name}-head`, { width: 0.4, height: 0.38, depth: 0.4 }, scene);
    head.position.y = 1.58;
    head.material = bodyMat;
    head.parent = this.root;
    this.head = head;

    const visor = MeshBuilder.CreateBox(`${name}-visor`, { width: 0.3, height: 0.12, depth: 0.04 }, scene);
    visor.position.set(0, 0.02, -0.2);
    visor.material = visorMat;
    visor.parent = head;

    const antenna = MeshBuilder.CreateCylinder(`${name}-ant`, { diameter: 0.04, height: 0.22, tessellation: 8 }, scene);
    antenna.position.set(0, 0.3, 0);
    antenna.material = accentMat;
    antenna.parent = head;
    const antennaTip = MeshBuilder.CreateSphere(`${name}-antTip`, { diameter: 0.09 }, scene);
    antennaTip.position.set(0, 0.42, 0);
    antennaTip.material = accentMat;
    antennaTip.parent = head;

    // Arms (pivoted at shoulder so they can swing)
    const armL = this.makeLimb(`${name}-armL`, scene, bodyMat, accentMat, 0.14, 0.52);
    armL.position.set(-0.42, 1.34, 0);
    armL.parent = this.root;
    this.armL = armL;

    const armR = this.makeLimb(`${name}-armR`, scene, bodyMat, accentMat, 0.14, 0.52);
    armR.position.set(0.42, 1.34, 0);
    armR.parent = this.root;
    this.armR = armR;

    // Legs
    const legL = this.makeLimb(`${name}-legL`, scene, bodyMat, accentMat, 0.17, 0.56);
    legL.position.set(-0.18, 0.56, 0);
    legL.parent = this.root;
    this.legL = legL;

    const legR = this.makeLimb(`${name}-legR`, scene, bodyMat, accentMat, 0.17, 0.56);
    legR.position.set(0.18, 0.56, 0);
    legR.parent = this.root;
    this.legR = legR;

    this.root.position.y = 0;
  }

  private makeLimb(
    name: string,
    scene: Scene,
    bodyMat: StandardMaterial,
    accentMat: StandardMaterial,
    diameter: number,
    height: number,
  ): Mesh {
    // A pivot mesh (invisible, zero size) at the joint, with the visible
    // limb mesh offset below/around it so rotating the pivot swings the limb.
    const pivot = MeshBuilder.CreateBox(`${name}-pivot`, { size: 0.001 }, scene);
    pivot.isVisible = false;

    const limb = MeshBuilder.CreateCylinder(name, { diameter, height, tessellation: 10 }, scene);
    limb.position.y = -height / 2;
    limb.material = bodyMat;
    limb.parent = pivot;

    const cap = MeshBuilder.CreateSphere(`${name}-cap`, { diameter: diameter * 1.15 }, scene);
    cap.position.y = -height;
    cap.material = accentMat;
    cap.parent = pivot;

    return pivot as unknown as Mesh;
  }

  /** Call every frame with dt (seconds) and whether the character is moving/running. */
  animate(dt: number, moving: boolean, running: boolean) {
    const speed = running ? 9 : 5.2;
    if (moving) {
      this.walkPhase += dt * speed;
    } else {
      // Ease back to neutral pose.
      this.walkPhase += (0 - (this.walkPhase % (Math.PI * 2) > Math.PI ? this.walkPhase - Math.PI * 2 : this.walkPhase)) * Math.min(1, dt * 6);
    }
    const swing = moving ? Math.sin(this.walkPhase) * (running ? 0.9 : 0.6) : 0;
    this.legL.rotation.x = swing;
    this.legR.rotation.x = -swing;
    this.armL.rotation.x = -swing * 0.8;
    this.armR.rotation.x = swing * 0.8;

    const bob = moving ? Math.abs(Math.sin(this.walkPhase)) * (running ? 0.08 : 0.05) : Math.sin(Date.now() / 600) * 0.015;
    this.torso.position.y = 1.02 + bob;
    this.head.position.y = 1.58 + bob;
  }

  /** Little "jump squash" / idle flourish helper used on landing. */
  pulseScale(scene: Scene) {
    const start = Date.now();
    const obs = scene.onBeforeRenderObservable.add(() => {
      const t = (Date.now() - start) / 220;
      if (t >= 1) {
        this.root.scaling.set(1, 1, 1);
        scene.onBeforeRenderObservable.remove(obs);
        return;
      }
      const s = 1 - Math.sin(t * Math.PI) * 0.12;
      this.root.scaling.set(1 + (1 - s) * 0.5, s, 1 + (1 - s) * 0.5);
    });
  }

  setEmissivePulse(intensity: number) {
    this.bodyMat.emissiveColor = this.bodyMat.diffuseColor.scale(intensity);
  }
}
