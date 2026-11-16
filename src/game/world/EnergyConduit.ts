import { Scene, Vector3, MeshBuilder, StandardMaterial, Color3, Mesh, PointLight } from '@babylonjs/core';

/**
 * A glowing crystal conduit. Solving its Python challenge charges it
 * (and the shared Vault Gate) — a visible, physical reward instead of
 * just a number going up somewhere off-screen.
 */
export class EnergyConduit {
  root: Mesh;
  position: Vector3;
  solved = false;
  private crystal: Mesh;
  private crystalMat: StandardMaterial;
  private glow: PointLight;
  private glowPhase = Math.random() * Math.PI * 2;

  constructor(scene: Scene, position: Vector3) {
    this.position = position;

    const baseMat = new StandardMaterial('conduitBaseMat', scene);
    baseMat.diffuseColor = new Color3(0.22, 0.24, 0.32);
    baseMat.specularColor = new Color3(0.3, 0.3, 0.35);

    const base = MeshBuilder.CreateCylinder(
      'conduitBase',
      { diameterTop: 0.55, diameterBottom: 0.8, height: 0.5, tessellation: 8 },
      scene,
    );
    base.position = position.clone();
    base.position.y = 0.25;
    base.material = baseMat;
    base.checkCollisions = true;
    this.root = base;

    this.crystalMat = new StandardMaterial('conduitCrystalMat', scene);
    this.crystalMat.diffuseColor = new Color3(0.55, 0.4, 1);
    this.crystalMat.emissiveColor = new Color3(0.5, 0.35, 0.95);
    this.crystalMat.alpha = 0.94;

    const crystal = MeshBuilder.CreatePolyhedron('conduitCrystal', { type: 3, size: 0.34 }, scene);
    crystal.position.set(0, 0.85, 0);
    crystal.material = this.crystalMat;
    crystal.parent = base;
    this.crystal = crystal;

    const glow = new PointLight(`conduitGlow`, position.add(new Vector3(0, 1.1, 0)), scene);
    glow.diffuse = new Color3(0.55, 0.4, 1);
    glow.intensity = 0.6;
    glow.range = 4;
    this.glow = glow;
  }

  update(dt: number) {
    this.glowPhase += dt * 2.4;
    this.crystal.rotation.y += dt * 1.3;
    const pulse = this.solved ? 1 : 0.55 + Math.sin(this.glowPhase) * 0.35;
    const baseColor = this.solved ? new Color3(0.3, 1, 0.55) : new Color3(0.5, 0.35, 0.95);
    this.crystalMat.emissiveColor = baseColor.scale(pulse);
    this.glow.diffuse = baseColor;
    this.glow.intensity = this.solved ? 0.9 : 0.5 + pulse * 0.2;
  }

  isNear(playerPos: Vector3, radius = 2.1): boolean {
    return Vector3.Distance(playerPos, this.position) < radius;
  }

  markSolved() {
    this.solved = true;
  }
}
