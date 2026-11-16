import { Scene, Vector3, MeshBuilder, StandardMaterial, Color3, Mesh } from '@babylonjs/core';

export class CodeTerminal {
  root: Mesh;
  private screenMat: StandardMaterial;
  private glowPhase = Math.random() * Math.PI * 2;
  solved = false;
  position: Vector3;

  constructor(scene: Scene, position: Vector3) {
    this.position = position;
    const baseMat = new StandardMaterial('termBaseMat', scene);
    baseMat.diffuseColor = new Color3(0.25, 0.27, 0.32);

    const base = MeshBuilder.CreateBox('termBase', { width: 0.9, height: 1.3, depth: 0.5 }, scene);
    base.position = position.clone();
    base.position.y = 0.65;
    base.material = baseMat;
    base.checkCollisions = true;
    this.root = base;

    const screenMat = new StandardMaterial('termScreenMat', scene);
    screenMat.diffuseColor = new Color3(0.1, 0.9, 0.75);
    screenMat.emissiveColor = new Color3(0.1, 0.8, 0.65);
    this.screenMat = screenMat;

    const screen = MeshBuilder.CreatePlane('termScreen', { width: 0.6, height: 0.8 }, scene);
    screen.position.set(0, 0.15, -0.26);
    screen.material = screenMat;
    screen.parent = base;

    const antenna = MeshBuilder.CreateCylinder('termAnt', { diameter: 0.06, height: 0.5, tessellation: 8 }, scene);
    antenna.position.set(0, 0.9, 0);
    antenna.material = baseMat;
    antenna.parent = base;
  }

  update(dt: number) {
    this.glowPhase += dt * 2;
    const pulse = this.solved ? 1 : 0.6 + Math.sin(this.glowPhase) * 0.3;
    this.screenMat.emissiveColor = (this.solved ? new Color3(0.2, 0.95, 0.35) : new Color3(0.1, 0.8, 0.65)).scale(pulse);
  }

  isNear(playerPos: Vector3, radius = 2.2): boolean {
    return Vector3.Distance(playerPos, this.position) < radius;
  }

  markSolved() {
    this.solved = true;
  }
}
