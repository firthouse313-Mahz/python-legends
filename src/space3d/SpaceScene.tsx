import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { SpaceshipAvatar } from './SpaceshipAvatar';
import {
  BOUNDS_X,
  BOUNDS_Y,
  SHIP_MOVE_SPEED,
  WRONG_ENERGY_COST,
  RIGHT_ENERGY_GAIN,
  currentSpeed,
  type SpacePhysics,
} from './spacePhysics';
import { PLANETS, DEBRIS_CLUSTERS, LEVEL_END_Z, type DebrisCluster, type PlanetHazard } from './spaceLevel';

export interface SpaceSceneCallbacks {
  onPlanetHit: (planet: PlanetHazard) => void;
  onDebrisResolved: (cluster: DebrisCluster, correct: boolean) => void;
  onLevelComplete: () => void;
  onLivesChange: (lives: number) => void;
  onEnergyChange: (energy: number) => void;
  onActivePromptChange: (prompt: string | null) => void;
}

function Starfield() {
  const points = useMemo(() => {
    const positions = new Float32Array(600 * 3);
    for (let i = 0; i < 600; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 40;
      positions[i * 3 + 1] = Math.random() * 20 - 2;
      positions[i * 3 + 2] = -Math.random() * (LEVEL_END_Z + 40);
    }
    return positions;
  }, []);
  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[points, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#ffffff" size={0.05} sizeAttenuation />
    </points>
  );
}

function Planet({ planet, playerZ, burst }: { planet: PlanetHazard; playerZ: number; burst: boolean }) {
  const ref = useRef<THREE.Group>(null);
  const dz = planet.z - playerZ;
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.8;
  });
  if (dz < -6 || dz > 40) return null;
  if (burst) return null;
  return (
    <group position={[planet.x, planet.y, -planet.z]} ref={ref}>
      <mesh castShadow>
        <sphereGeometry args={[planet.radius, 20, 16]} />
        <meshStandardMaterial color={planet.color} roughness={0.8} />
      </mesh>
      {planet.ringColor && (
        <mesh rotation={[Math.PI / 2.4, 0, 0]}>
          <torusGeometry args={[planet.radius * 1.5, 0.04, 8, 32]} />
          <meshStandardMaterial color={planet.ringColor} emissive={planet.ringColor} emissiveIntensity={0.4} />
        </mesh>
      )}
    </group>
  );
}

function CometBurst({ planet }: { planet: PlanetHazard }) {
  const groupRef = useRef<THREE.Group>(null);
  const age = useRef(0);
  const shards = useMemo(
    () =>
      Array.from({ length: 6 }).map((_, i) => ({
        dir: new THREE.Vector3(Math.cos((i / 6) * Math.PI * 2), Math.sin((i / 6) * Math.PI * 2), (Math.random() - 0.5)).normalize(),
      })),
    [],
  );
  useFrame((_, dt) => {
    age.current += dt;
    if (groupRef.current) {
      groupRef.current.children.forEach((child, i) => {
        child.position.addScaledVector(shards[i].dir, dt * 4);
        child.scale.setScalar(Math.max(0, 1 - age.current * 0.6));
      });
    }
  });
  if (age.current > 1.6) return null;
  return (
    <group ref={groupRef} position={[planet.x, planet.y, -planet.z]}>
      {shards.map((_, i) => (
        <mesh key={i}>
          <dodecahedronGeometry args={[0.14, 0]} />
          <meshStandardMaterial color="#ff9a3c" emissive="#ff6a1c" emissiveIntensity={1.2} />
        </mesh>
      ))}
    </group>
  );
}

function DebrisTargets({
  cluster,
  playerZ,
  shipX,
  shipY,
  resolved,
}: {
  cluster: DebrisCluster;
  playerZ: number;
  shipX: number;
  shipY: number;
  resolved: boolean;
}) {
  const dz = cluster.z - playerZ;
  if (dz < -4 || dz > 30 || resolved) return null;
  const opacity = dz > 18 ? Math.max(0, 1 - (dz - 18) / 12) : 1;
  // highlight whichever debris the ship is currently closest to lining up
  // with — this is the "aim," continuous rather than a lane toggle.
  let nearest = 0;
  let nearestDist = Infinity;
  cluster.positions.forEach(([x, y], i) => {
    const d = Math.hypot(x - shipX, y - shipY);
    if (d < nearestDist) {
      nearestDist = d;
      nearest = i;
    }
  });
  return (
    <group position={[0, 0, -cluster.z]}>
      {cluster.options.map((opt, i) => {
        const [x, y] = cluster.positions[i];
        const isAligned = i === nearest && nearestDist < 0.9;
        return (
          <group key={i} position={[x, y, 0]}>
            {isAligned && (
              <mesh rotation={[0, 0, Math.PI / 4]}>
                <ringGeometry args={[0.38, 0.46, 4]} />
                <meshBasicMaterial color="#ffd166" transparent opacity={opacity} />
              </mesh>
            )}
            <mesh rotation={[0.4, 0.6, 0]}>
              <octahedronGeometry args={[0.26, 0]} />
              <meshStandardMaterial
                color={opt.correct ? '#2fae4a' : '#8a8a94'}
                emissive={opt.correct ? '#1c7f3a' : '#3a3a40'}
                emissiveIntensity={0.4}
                transparent
                opacity={opacity * 0.95}
              />
            </mesh>
            <Html center distanceFactor={6} style={{ opacity, pointerEvents: 'none', width: 110 }}>
              <div className={`spc-debris-label${isAligned ? ' spc-debris-label-aligned' : ''}`}>{opt.text}</div>
            </Html>
          </group>
        );
      })}
    </group>
  );
}

export function SpaceScene({
  physicsRef,
  callbacks,
  fireApiRef,
}: {
  physicsRef: React.RefObject<SpacePhysics>;
  callbacks: SpaceSceneCallbacks;
  fireApiRef: React.MutableRefObject<(() => void) | null>;
}) {
  const shipRef = useRef<THREE.Group>(null);
  const projectileRefs = useRef<Map<number, THREE.Object3D>>(new Map());
  const burstPlanetIds = useRef<Set<string>>(new Set());
  const lastPromptRef = useRef<string | null>(null);
  const { camera } = useThree();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const p = physicsRef.current;
      if (p.paused) return;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') p.moveX = -1;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') p.moveX = 1;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') p.moveY = 1;
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') p.moveY = -1;
      if (e.key === 'f' || e.key === 'F' || e.key === 'Enter' || e.key === ' ') fire();
    }
    function onKeyUp(e: KeyboardEvent) {
      const p = physicsRef.current;
      if (['ArrowLeft', 'a', 'A', 'ArrowRight', 'd', 'D'].includes(e.key)) p.moveX = 0;
      if (['ArrowUp', 'w', 'W', 'ArrowDown', 's', 'S'].includes(e.key)) p.moveY = 0;
    }
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [physicsRef]);

  function fire() {
    const p = physicsRef.current;
    if (p.paused) return;
    const cluster = DEBRIS_CLUSTERS.find((c) => !p.resolvedDebrisIds.has(c.id) && c.z - p.z < 24 && c.z - p.z > -2);
    if (!cluster) return;
    p.projectiles.push({
      id: p.nextProjectileId++,
      x: p.x,
      y: p.y,
      z: cluster.z,
      startZ: p.z,
      t: 0,
    });
  }
  fireApiRef.current = fire;

  useFrame((_, dtRaw) => {
    const p = physicsRef.current;
    const dt = Math.min(dtRaw, 0.05);
    if (p.paused) return;

    if (p.invulnTimer > 0) p.invulnTimer = Math.max(0, p.invulnTimer - dt);
    if (p.boostTimer > 0) p.boostTimer = Math.max(0, p.boostTimer - dt);

    p.z += currentSpeed(p) * dt;
    p.x = THREE.MathUtils.clamp(p.x + p.moveX * SHIP_MOVE_SPEED * dt, -BOUNDS_X, BOUNDS_X);
    p.y = THREE.MathUtils.clamp(p.y + p.moveY * SHIP_MOVE_SPEED * dt, BOUNDS_Y[0], BOUNDS_Y[1]);

    // planet collisions — physical hazard, costs a life, never just energy
    if (p.invulnTimer <= 0) {
      for (const planet of PLANETS) {
        if (p.hitPlanetIds.has(planet.id)) continue;
        if (Math.abs(planet.z - p.z) > 1.2) continue;
        const d = Math.hypot(planet.x - p.x, planet.y - p.y);
        if (d < planet.radius + 0.35) {
          p.hitPlanetIds.add(planet.id);
          burstPlanetIds.current.add(planet.id);
          p.lives = Math.max(0, p.lives - 1);
          p.invulnTimer = 1.4;
          callbacks.onLivesChange(p.lives);
          callbacks.onPlanetHit(planet);
        }
      }
    }

    // debris projectile resolution
    for (let i = p.projectiles.length - 1; i >= 0; i--) {
      const proj = p.projectiles[i];
      proj.t += dt * 2.6;
      if (proj.t >= 1) {
        const cluster = DEBRIS_CLUSTERS.find((c) => c.z === proj.z);
        if (cluster && !p.resolvedDebrisIds.has(cluster.id)) {
          let nearest = 0;
          let nearestDist = Infinity;
          cluster.positions.forEach(([x, y], idx) => {
            const d = Math.hypot(x - proj.x, y - proj.y);
            if (d < nearestDist) {
              nearestDist = d;
              nearest = idx;
            }
          });
          if (nearestDist < 0.9) {
            p.resolvedDebrisIds.add(cluster.id);
            const correct = cluster.options[nearest].correct;
            if (correct) {
              p.energy = Math.min(100, p.energy + RIGHT_ENERGY_GAIN);
              p.boostTimer = 1.6;
            } else {
              p.energy = Math.max(0, p.energy - WRONG_ENERGY_COST);
            }
            callbacks.onEnergyChange(p.energy);
            callbacks.onDebrisResolved(cluster, correct);
          }
        }
        p.projectiles.splice(i, 1);
        projectileRefs.current.delete(proj.id);
      }
    }

    if (p.z >= LEVEL_END_Z) {
      p.paused = true;
      callbacks.onLevelComplete();
    }

    if (shipRef.current) {
      shipRef.current.position.set(p.x, p.y, -p.z);
      shipRef.current.rotation.z = -p.moveX * 0.35;
      shipRef.current.rotation.x = Math.PI + p.moveY * 0.15;
    }
    camera.position.set(p.x * 0.5, p.y + 1.2, -p.z + 5.5);
    camera.lookAt(p.x, p.y, -p.z - 3);

    for (const proj of p.projectiles) {
      const obj = projectileRefs.current.get(proj.id);
      if (obj) {
        const worldZ = -(proj.startZ + (proj.z - proj.startZ) * proj.t);
        obj.position.set(proj.x, proj.y, worldZ);
      }
    }

    const activeCluster = DEBRIS_CLUSTERS.find((c) => !p.resolvedDebrisIds.has(c.id) && c.z - p.z < 30 && c.z - p.z > -2);
    const nextPrompt = activeCluster?.prompt ?? null;
    if (nextPrompt !== lastPromptRef.current) {
      lastPromptRef.current = nextPrompt;
      callbacks.onActivePromptChange(nextPrompt);
    }
  });

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[8, 12, 6]} intensity={0.9} />
      <color attach="background" args={['#05081a']} />
      <Starfield />

      {PLANETS.map((planet) => (
        <Planet key={planet.id} planet={planet} playerZ={physicsRef.current.z} burst={physicsRef.current.hitPlanetIds.has(planet.id)} />
      ))}
      {PLANETS.filter((pl) => physicsRef.current.hitPlanetIds.has(pl.id)).map((pl) => (
        <CometBurst key={pl.id} planet={pl} />
      ))}

      {DEBRIS_CLUSTERS.map((c) => (
        <DebrisTargets
          key={c.id}
          cluster={c}
          playerZ={physicsRef.current.z}
          shipX={physicsRef.current.x}
          shipY={physicsRef.current.y}
          resolved={physicsRef.current.resolvedDebrisIds.has(c.id)}
        />
      ))}

      {physicsRef.current.projectiles.map((proj) => (
        <mesh
          key={proj.id}
          ref={(el) => {
            if (el) projectileRefs.current.set(proj.id, el);
          }}
        >
          <sphereGeometry args={[0.1, 10, 10]} />
          <meshStandardMaterial color="#5ce1e6" emissive="#1c9dff" emissiveIntensity={1.2} />
        </mesh>
      ))}

      <group position={[0, 1.8, -LEVEL_END_Z]}>
        <mesh>
          <torusGeometry args={[1.5, 0.12, 10, 28]} />
          <meshStandardMaterial color="#5ce1e6" emissive="#1c9dff" emissiveIntensity={1.4} />
        </mesh>
      </group>

      <group ref={shipRef}>
        <SpaceshipAvatar />
      </group>
    </>
  );
}
