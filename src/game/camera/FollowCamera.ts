import { ArcRotateCamera, Scene, Vector3 } from '@babylonjs/core';
import { InputManager } from '../controls/InputManager';

/**
 * Third-person camera that orbits/follows a target position. Drag (mouse or
 * touch) orbits the camera; it never collides, it just always looks at the
 * player from a configurable distance/height.
 */
export class FollowCamera {
  camera: ArcRotateCamera;
  private input: InputManager;

  constructor(scene: Scene, canvas: HTMLCanvasElement, input: InputManager, target: Vector3) {
    this.input = input;
    this.camera = new ArcRotateCamera(
      'followCam',
      -Math.PI / 2,
      Math.PI / 3.2,
      7,
      target.add(new Vector3(0, 1.3, 0)),
      scene,
    );
    this.camera.lowerRadiusLimit = 3.5;
    this.camera.upperRadiusLimit = 12;
    this.camera.lowerBetaLimit = 0.35;
    this.camera.upperBetaLimit = Math.PI / 2.1;
    this.camera.inputs.clear(); // we drive orbit manually from InputManager
    this.camera.minZ = 0.1;
    // Attaching with no controls still lets us set alpha/beta/radius by hand.
    canvas.tabIndex = 1;
  }

  /** Current camera yaw, used by the player to resolve "forward" direction. */
  get yaw(): number {
    return this.camera.alpha + Math.PI / 2;
  }

  update(targetPos: Vector3) {
    const look = this.input.consumeLook();
    const sensitivity = 0.01;
    this.camera.alpha -= look.x * sensitivity;
    this.camera.beta -= look.y * sensitivity;
    this.camera.beta = Math.max(this.camera.lowerBetaLimit!, Math.min(this.camera.upperBetaLimit!, this.camera.beta));

    const desired = targetPos.add(new Vector3(0, 1.3, 0));
    Vector3.LerpToRef(this.camera.target, desired, 0.25, this.camera.target);
  }
}
