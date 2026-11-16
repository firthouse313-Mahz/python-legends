import {
  Color3,
  Color4,
  DirectionalLight,
  HemisphericLight,
  Mesh,
  MeshBuilder,
  Scene,
  ShadowGenerator,
  StandardMaterial,
  Vector3,
} from '@babylonjs/core';
import { GridMaterial } from '@babylonjs/materials/grid';

export interface Coin {
  mesh: Mesh;
  collected: boolean;
}

export class VillageWorld {
  ground: Mesh;
  coins: Coin[] = [];
  shadowGenerator: ShadowGenerator;
  readonly bounds = 14; // half-extent of the playable square
  scene: Scene;

  constructor(scene: Scene) {
    this.scene = scene;
    scene.clearColor = new Color4(0.55, 0.78, 0.92, 1);

    // --- Lighting -------------------------------------------------------
    const hemi = new HemisphericLight('hemi', new Vector3(0, 1, 0.2), scene);
    hemi.intensity = 0.75;
    hemi.groundColor = new Color3(0.35, 0.4, 0.3);

    const sun = new DirectionalLight('sun', new Vector3(-0.5, -1, -0.3), scene);
    sun.position = new Vector3(20, 30, 20);
    sun.intensity = 0.9;
    this.shadowGenerator = new ShadowGenerator(1024, sun);
    this.shadowGenerator.usePercentageCloserFiltering = true;

    // --- Ground -----------------------------------------------------------
    const ground = MeshBuilder.CreateGround('ground', { width: this.bounds * 2, height: this.bounds * 2 }, scene);
    const gridMat = new GridMaterial('groundMat', scene);
    gridMat.mainColor = new Color3(0.42, 0.72, 0.4);
    gridMat.lineColor = new Color3(0.3, 0.58, 0.32);
    gridMat.gridRatio = 1;
    gridMat.majorUnitFrequency = 4;
    gridMat.minorUnitVisibility = 0.35;
    gridMat.opacity = 1;
    ground.material = gridMat;
    ground.receiveShadows = true;
    ground.checkCollisions = true;
    this.ground = ground;

    // Low wall around the playable area so the player can't wander forever.
    this.buildBoundaryWalls();

    // Scenery: simple original low-poly trees & rocks scattered around.
    this.scatterScenery();

    // Coins
    this.placeCoinTrail();
  }

  private buildBoundaryWalls() {
    const wallMat = new StandardMaterial('wallMat', this.scene);
    wallMat.diffuseColor = new Color3(0.55, 0.42, 0.3);
    const h = 1.6;
    const positions: [number, number, number, number][] = [
      [0, -this.bounds, this.bounds * 2, 0.6], // south
      [0, this.bounds, this.bounds * 2, 0.6], // north
      [-this.bounds, 0, 0.6, this.bounds * 2], // west
      [this.bounds, 0, 0.6, this.bounds * 2], // east
    ];
    for (const [x, z, w, d] of positions) {
      const wall = MeshBuilder.CreateBox('wall', { width: w, height: h, depth: d }, this.scene);
      wall.position.set(x, h / 2, z);
      wall.material = wallMat;
      wall.checkCollisions = true;
      wall.receiveShadows = true;
      this.shadowGenerator.addShadowCaster(wall);
    }
  }

  private scatterScenery() {
    const trunkMat = new StandardMaterial('trunkMat', this.scene);
    trunkMat.diffuseColor = new Color3(0.42, 0.28, 0.18);
    const leafMat = new StandardMaterial('leafMat', this.scene);
    leafMat.diffuseColor = new Color3(0.25, 0.6, 0.3);
    const rockMat = new StandardMaterial('rockMat', this.scene);
    rockMat.diffuseColor = new Color3(0.55, 0.55, 0.58);

    const treeSpots: [number, number][] = [
      [-9, -7], [-10, 3], [-6, 9], [8, -9], [10, 2], [6, 8], [-3, -11], [3, 11],
    ];
    treeSpots.forEach(([x, z], i) => {
      const trunk = MeshBuilder.CreateCylinder(`trunk${i}`, { diameter: 0.5, height: 1.6, tessellation: 8 }, this.scene);
      trunk.position.set(x, 0.8, z);
      trunk.material = trunkMat;
      trunk.checkCollisions = true;
      trunk.receiveShadows = true;
      this.shadowGenerator.addShadowCaster(trunk);

      const leaves = MeshBuilder.CreateSphere(`leaves${i}`, { diameter: 2.1, segments: 6 }, this.scene);
      leaves.position.set(x, 2.1, z);
      leaves.material = leafMat;
      leaves.receiveShadows = true;
      this.shadowGenerator.addShadowCaster(leaves);
    });

    const rockSpots: [number, number][] = [[-5, 2], [5, -4], [-2, 6], [2, -8]];
    rockSpots.forEach(([x, z], i) => {
      const rock = MeshBuilder.CreateSphere(`rock${i}`, { diameter: 0.9, segments: 4 }, this.scene);
      rock.position.set(x, 0.3, z);
      rock.scaling.y = 0.6;
      rock.material = rockMat;
      rock.checkCollisions = true;
      this.shadowGenerator.addShadowCaster(rock);
    });
  }

  private placeCoinTrail() {
    const coinMat = new StandardMaterial('coinMat', this.scene);
    coinMat.diffuseColor = new Color3(1, 0.84, 0.2);
    coinMat.emissiveColor = new Color3(0.55, 0.42, 0.05);

    const spots: [number, number][] = [
      [-2, -3], [-1, -1], [0, 1], [1, 3], [2.5, 5], [-4, 4], [-6, 6],
    ];
    spots.forEach(([x, z], i) => {
      const coin = MeshBuilder.CreateTorus(`coin${i}`, { diameter: 0.55, thickness: 0.18, tessellation: 16 }, this.scene);
      coin.position.set(x, 1, z);
      coin.rotation.x = Math.PI / 2;
      coin.material = coinMat;
      this.shadowGenerator.addShadowCaster(coin);
      this.coins.push({ mesh: coin, collected: false });
    });
  }

  animateCoins(dt: number) {
    const t = performance.now() / 500;
    for (const c of this.coins) {
      if (c.collected) continue;
      c.mesh.rotation.y += dt * 2.4;
      c.mesh.position.y = 1 + Math.sin(t + c.mesh.position.x) * 0.12;
    }
  }

  private treasureCount = 0;

  /**
   * The physical payoff for solving a terminal: a treasure chest pops open
   * on the spot and scatters a few bonus coins nearby for the player to
   * run over and actually collect — something happens in the 3D world,
   * not just a text banner.
   */
  spawnTreasureChest(nearPosition: Vector3): void {
    const id = this.treasureCount++;
    const woodMat = new StandardMaterial(`chestWood${id}`, this.scene);
    woodMat.diffuseColor = new Color3(0.5, 0.32, 0.15);
    const goldMat = new StandardMaterial(`chestGold${id}`, this.scene);
    goldMat.diffuseColor = new Color3(0.9, 0.75, 0.2);
    goldMat.emissiveColor = new Color3(0.4, 0.32, 0.05);

    const chestPos = nearPosition.clone();
    chestPos.y = 0;

    const base = MeshBuilder.CreateBox(`chestBase${id}`, { width: 0.7, height: 0.4, depth: 0.5 }, this.scene);
    base.position = chestPos.add(new Vector3(0, 0.2, 0));
    base.material = woodMat;
    this.shadowGenerator.addShadowCaster(base);

    const lid = MeshBuilder.CreateBox(`chestLid${id}`, { width: 0.72, height: 0.22, depth: 0.52 }, this.scene);
    lid.position = chestPos.add(new Vector3(0, 0.42, -0.14));
    lid.rotation.x = -0.9; // tipped back — the chest is shown already open
    lid.material = woodMat;

    const trim = MeshBuilder.CreateBox(`chestTrim${id}`, { width: 0.74, height: 0.08, depth: 0.52 }, this.scene);
    trim.position = chestPos.add(new Vector3(0, 0.4, 0));
    trim.material = goldMat;

    // Pop-open bounce.
    const start = Date.now();
    const obs = this.scene.onBeforeRenderObservable.add(() => {
      const t = (Date.now() - start) / 260;
      if (t >= 1) {
        base.scaling.set(1, 1, 1);
        this.scene.onBeforeRenderObservable.remove(obs);
        return;
      }
      const s = 1 + Math.sin(t * Math.PI) * 0.25;
      base.scaling.set(s, s, s);
    });

    const coinMat = new StandardMaterial(`bonusCoinMat${id}`, this.scene);
    coinMat.diffuseColor = new Color3(1, 0.84, 0.2);
    coinMat.emissiveColor = new Color3(0.55, 0.42, 0.05);

    const scatter: [number, number][] = [
      [0.9, 0.4],
      [-0.7, 0.8],
      [0.3, -0.9],
    ];
    scatter.forEach(([dx, dz], i) => {
      const coin = MeshBuilder.CreateTorus(`bonusCoin${id}-${i}`, { diameter: 0.55, thickness: 0.18, tessellation: 16 }, this.scene);
      coin.position.set(chestPos.x + dx, 1, chestPos.z + dz);
      coin.rotation.x = Math.PI / 2;
      coin.material = coinMat;
      this.shadowGenerator.addShadowCaster(coin);
      this.coins.push({ mesh: coin, collected: false });
    });
  }
}
