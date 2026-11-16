import { Scene, Vector3, MeshBuilder, StandardMaterial, Color3, Mesh } from '@babylonjs/core';

/**
 * A glowing barrier blocking the path to the main terminal. It's a real
 * collider (checkCollisions = true) until enough energy has been charged
 * at the conduits, at which point it visually sinks away and stops
 * blocking the player — the literal, physical "hurdle" the player has to
 * earn their way past rather than just walk through.
 */
export class EnergyGate {
  mesh: Mesh;
  private mat: StandardMaterial;
  private opened = false;
  private restHeight: number;

  constructor(scene: Scene, center: Vector3, width: number, height = 3.4) {
    this.restHeight = height;
    const mat = new StandardMaterial('energyGateMat', scene);
    mat.diffuseColor = new Color3(0.2, 0.55, 0.95);
    mat.emissiveColor = new Color3(0.2, 0.5, 0.9);
    mat.alpha = 0.55;
    mat.backFaceCulling = false;
    this.mat = mat;

    const wall = MeshBuilder.CreateBox('energyGate', { width, height, depth: 0.4 }, scene);
    wall.position = center.clone();
    wall.position.y = height / 2;
    wall.material = mat;
    wall.checkCollisions = true;
    this.mesh = wall;
  }

  /** 0 (empty) to 1 (fully charged) — purely visual until open() is called. */
  update(dt: number, chargeRatio: number) {
    const c = Math.min(1, Math.max(0, chargeRatio));
    if (!this.opened) {
      this.mat.emissiveColor = new Color3(0.2 + c * 0.55, 0.5 + c * 0.45, 0.9 - c * 0.35);
      this.mat.alpha = 0.4 + c * 0.25;
    } else {
      this.mesh.position.y -= dt * 1.4;
      this.mat.alpha = Math.max(0, this.mat.alpha - dt * 0.9);
      if (this.mesh.position.y < -this.restHeight) {
        this.mesh.setEnabled(false);
      }
    }
  }

  open() {
    if (this.opened) return;
    this.opened = true;
    this.mesh.checkCollisions = false;
  }

  get isOpen() {
    return this.opened;
  }
}
