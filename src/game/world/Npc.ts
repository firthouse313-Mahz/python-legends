import { Scene, Vector3, MeshBuilder, StandardMaterial, Color3 } from '@babylonjs/core';
import { RobotCharacter, NPC_COLORS } from '../characters/RobotCharacter';

export class Npc {
  character: RobotCharacter;
  position: Vector3;
  private idlePhase = Math.random() * Math.PI * 2;
  private promptIcon: ReturnType<typeof MeshBuilder.CreatePlane>;
  dialog: string[];

  constructor(scene: Scene, position: Vector3, dialog: string[]) {
    this.position = position;
    this.dialog = dialog;
    this.character = new RobotCharacter(scene, 'npc', NPC_COLORS);
    this.character.root.position = position.clone();
    this.character.root.rotation.y = Math.PI; // face the player's spawn

    // A simple floating "!" prompt above the NPC's head, shown when the
    // player is close enough to interact.
    const mat = new StandardMaterial('npcPromptMat', scene);
    mat.diffuseColor = new Color3(1, 0.9, 0.2);
    mat.emissiveColor = new Color3(0.8, 0.7, 0.1);
    mat.backFaceCulling = false;
    const icon = MeshBuilder.CreatePlane('npcPrompt', { size: 0.4 }, scene);
    icon.position = position.add(new Vector3(0, 2.3, 0));
    icon.material = mat;
    icon.billboardMode = 7; // Mesh.BILLBOARDMODE_ALL — always faces the camera
    icon.isVisible = false;
    this.promptIcon = icon;
  }

  update(dt: number, playerPos: Vector3) {
    this.idlePhase += dt;
    this.character.animate(0.016, false, false);
    this.character.root.position.y = Math.sin(this.idlePhase * 1.5) * 0.02;
    const dist = Vector3.Distance(playerPos, this.position);
    this.promptIcon.isVisible = dist < 3.2;
    this.promptIcon.position.y = this.position.y + 2.3 + Math.sin(this.idlePhase * 2) * 0.06;
  }

  isNear(playerPos: Vector3, radius = 2.4): boolean {
    return Vector3.Distance(playerPos, this.position) < radius;
  }
}
