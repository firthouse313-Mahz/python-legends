import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { SpaceshipAvatar } from './SpaceshipAvatar';
import { EnemyUfo } from './EnemyUfo';
import {
  BOUNDS_X,
  BOUNDS_Y,
  SHIP_MOVE_SPEED,
  DEBRIS_ENERGY_GAIN,
  DEBRIS_MAGNET_RADIUS,
  DEBRIS_COLLECT_RADIUS,
  UFO_ENERGY_GAIN,
  MAX_LIVES,
  currentSpeed,
  type SpacePhysics,
} from './spacePhysics';
import { PLANETS, DEBRIS_PICKUPS, ENEMY_ENCOUNTERS, LEVEL_END_Z, type EnemyEncounter, type PlanetHazard, type DebrisPickup } from './spaceLevel';

export interface SpaceSceneCallbacks {
  onPlanetHit: (planet: PlanetHazard) => void;
  onCometHit: () => void;
  onDebrisCollected: (pickup: DebrisPickup) => void;
  onEnemyResolved: (enemy: EnemyEncounter, correct: boolean) => void;
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
  if (dz < -6 || dz > 40 || burst) return null;
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

/** A visibly recognizable piece of floating plastic waste — a crumpled
 *  bottle shape in bright, glowing material so it reads clearly against
 *  deep space, with a soft pulsing ring marking it as "collect me". It
 *  also visibly drifts toward the ship once the ship is close, so
 *  picking it up reads as one deliberate, visible pull-in rather than
 *  something that happens invisibly underfoot. */
function DebrisPickupView({
  pickup,
  playerZ,
  shipX,
  shipY,
  collected,
}: {
  pickup: DebrisPickup;
  playerZ: number;
  shipX: number;
  shipY: number;
  collected: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Mesh>(null);
  const drift = useRef({ x: 0, y: 0 });
  const dz = pickup.z - playerZ;

  useFrame((_, dt) => {
    if (bodyRef.current) {
      bodyRef.current.rotation.x += dt * 1.1;
      bodyRef.current.rotation.y += dt * 1.6;
    }
    if (groupRef.current) {
      const d = Math.hypot(pickup.x - shipX, pickup.y - shipY);
      if (Math.abs(dz) < DEBRIS_MAGNET_RADIUS * 1.4 && d < DEBRIS_MAGNET_RADIUS) {
        const pull = 1 - d / DEBRIS_MAGNET_RADIUS; // 0 at the edge, 1 at the ship
        drift.current.x += ((shipX - pickup.x) * pull * 2.2 - drift.current.x) * Math.min(1, dt * 6);
        drift.current.y += ((shipY - pickup.y) * pull * 2.2 - drift.current.y) * Math.min(1, dt * 6);
      } else {
        drift.current.x *= 0.9;
        drift.current.y *= 0.9;
      }
      groupRef.current.position.set(pickup.x + drift.current.x, pickup.y + drift.current.y, -pickup.z);
    }
  });

  if (dz < -4 || dz > 26 || collected) return null;
  const opacity = dz > 16 ? Math.max(0, 1 - (dz - 16) / 10) : 1;
  return (
    <group ref={groupRef} position={[pickup.x, pickup.y, -pickup.z]}>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <ringGeometry args={[0.24, 0.3, 24]} />
        <meshBasicMaterial color="#9affe0" transparent opacity={0.45 * opacity} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={bodyRef}>
        <capsuleGeometry args={[0.1, 0.16, 4, 8]} />
        <meshStandardMaterial
          color="#d9fff0"
          emissive="#53e0b8"
          emissiveIntensity={0.7}
          transparent
          opacity={0.92 * opacity}
          roughness={0.25}
        />
      </mesh>
      <Html center distanceFactor={6} style={{ opacity, pointerEvents: 'none' }}>
        <div className="spc-debris-tag">♻️</div>
      </Html>
    </group>
  );
}

function EnemyTargets({
  encounter,
  playerZ,
  shipX,
  shipY,
  resolved,
}: {
  encounter: EnemyEncounter;
  playerZ: number;
  shipX: number;
  shipY: number;
  resolved: boolean;
}) {
  const dz = encounter.z - playerZ;
  if (dz < -4 || dz > 30 || resolved) return null;
  const opacity = dz > 18 ? Math.max(0, 1 - (dz - 18) / 12) : 1;
  let nearest = 0;
  let nearestDist = Infinity;
  encounter.positions.forEach(([x, y], i) => {
    const d = Math.hypot(x - shipX, y - shipY);
    if (d < nearestDist) {
      nearestDist = d;
      nearest = i;
    }
  });
  return (
    <group position={[0, 0, -encounter.z]}>
      {encounter.options.map((opt, i) => {
        const [x, y] = encounter.positions[i];
        const isAligned = i === nearest && nearestDist < 0.9;
        return (
          <group key={i} position={[x, y, 0]}>
            {isAligned && (
              <mesh rotation={[0, 0, Math.PI / 4]} position={[0, 0.45, 0]}>
                <ringGeometry args={[0.4, 0.48, 4]} />
                <meshBasicMaterial color="#ffd166" transparent opacity={opacity} />
              </mesh>
            )}
            <group scale={opacity}>
              <EnemyUfo hostile={!opt.correct} />
            </group>
            <Html center distanceFactor={6} style={{ opacity, pointerEvents: 'none', width: 110, marginTop: 28 }}>
              <div className={`spc-debris-label${isAligned ? ' spc-debris-label-aligned' : ''}`}>{opt.text}</div>
            </Html>
          </group>
        );
      })}
    </group>
  );
}

/** A quick expanding/fading burst at the exact spot a pickup was just
 *  eaten — the visible "got it" confirmation, on top of the toast. */
function PickupBurst({ x, y, z, age }: { x: number; y: number; z: number; age: number }) {
  const life = age / 0.5;
  const scale = 0.15 + life * 0.9;
  const opacity = Math.max(0, 1 - life);
  return (
    <mesh position={[x, y, -z]} rotation={[0, 0, 0]} scale={scale}>
      <ringGeometry args={[0.5, 0.62, 20]} />
      <meshBasicMaterial color="#9affe0" transparent opacity={opacity} side={THREE.DoubleSide} />
    </mesh>
  );
}

function CometShardView({ x, y, z }: { x: number; y: number; z: number }) {
  return (
    <mesh position={[x, y, -z]} rotation={[Math.random(), Math.random(), 0]}>
      <dodecahedronGeometry args={[0.15, 0]} />
      <meshStandardMaterial color="#ff9a3c" emissive="#ff6a1c" emissiveIntensity={1} />
    </mesh>
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
      // Up Arrow both nudges the ship up AND fires — it's the primary
      // fire key here (F / Enter / Space and the on-screen button still
      // work too), since firing while climbing is never a conflict.
      if (e.key === 'ArrowUp' || e.key === 'f' || e.key === 'F' || e.key === 'Enter' || e.key === ' ') fire();
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
    const enemy = ENEMY_ENCOUNTERS.find((e) => !p.resolvedEnemyIds.has(e.id) && e.z - p.z < 24 && e.z - p.z > -2);
    if (!enemy) return;
    p.projectiles.push({ id: p.nextProjectileId++, x: p.x, y: p.y, z: enemy.z, startZ: p.z, t: 0 });
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

    // --- planet collisions: physical hazard, costs a life, bursts into
    // persistent comet shards (a real new obstacle, not decoration) ---
    if (p.invulnTimer <= 0) {
      for (const planet of PLANETS) {
        if (p.hitPlanetIds.has(planet.id)) continue;
        if (Math.abs(planet.z - p.z) > 1.2) continue;
        const d = Math.hypot(planet.x - p.x, planet.y - p.y);
        if (d < planet.radius + 0.35) {
          p.hitPlanetIds.add(planet.id);
          p.lives = Math.max(0, p.lives - 1);
          p.invulnTimer = 1.4;
          callbacks.onLivesChange(p.lives);
          callbacks.onPlanetHit(planet);
          for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            p.comets.push({
              id: `comet-${p.nextCometId++}`,
              x: planet.x,
              y: planet.y,
              z: planet.z,
              vx: Math.cos(angle) * 1.2,
              vy: Math.sin(angle) * 1.2,
              age: 0,
            });
          }
        }
      }
    }

    // --- comet shards: keep moving, can hit the ship too, expire after a
    // few seconds ---
    for (let i = p.comets.length - 1; i >= 0; i--) {
      const comet = p.comets[i];
      comet.age += dt;
      comet.x += comet.vx * dt;
      comet.y += comet.vy * dt;
      if (comet.age > 3.2) {
        p.comets.splice(i, 1);
        continue;
      }
      if (p.invulnTimer <= 0 && Math.abs(comet.z - p.z) < 1.0) {
        const d = Math.hypot(comet.x - p.x, comet.y - p.y);
        if (d < 0.45) {
          p.comets.splice(i, 1);
          p.lives = Math.max(0, p.lives - 1);
          p.invulnTimer = 1.4;
          callbacks.onLivesChange(p.lives);
          callbacks.onCometHit();
        }
      }
    }

    // --- ambient debris pickups: passive, no question — the ship's
    // "magnet" pulls them in on approach (see DebrisPickupView) and they
    // are actually collected once close enough, with a visible burst at
    // the exact collection point so "it got eaten" is unmistakable ---
    for (const pickup of DEBRIS_PICKUPS) {
      if (p.collectedDebrisIds.has(pickup.id)) continue;
      if (Math.abs(pickup.z - p.z) > 1.0) continue;
      const d = Math.hypot(pickup.x - p.x, pickup.y - p.y);
      if (d < DEBRIS_COLLECT_RADIUS) {
        p.collectedDebrisIds.add(pickup.id);
        p.energy = Math.min(100, p.energy + DEBRIS_ENERGY_GAIN);
        p.pickupEffects.push({ id: `pk-${p.nextPickupEffectId++}`, x: p.x, y: p.y, z: p.z, age: 0 });
        callbacks.onEnergyChange(p.energy);
        callbacks.onDebrisCollected(pickup);
      }
    }

    // --- pickup bursts: brief visual confirmation, then gone ---
    for (let i = p.pickupEffects.length - 1; i >= 0; i--) {
      p.pickupEffects[i].age += dt;
      if (p.pickupEffects[i].age > 0.5) p.pickupEffects.splice(i, 1);
    }

    // --- enemy UFO resolution: steer into alignment, then fire (Up
    // Arrow / FIRE button) — only a CORRECT hit destroys the UFO and
    // restores energy AND a lost life. A wrong hit does nothing and the
    // UFO stays, so the student can re-aim and try again, no penalty ---
    for (let i = p.projectiles.length - 1; i >= 0; i--) {
      const proj = p.projectiles[i];
      proj.t += dt * 2.6;
      if (proj.t >= 1) {
        const enemy = ENEMY_ENCOUNTERS.find((e) => e.z === proj.z);
        if (enemy && !p.resolvedEnemyIds.has(enemy.id)) {
          let nearest = 0;
          let nearestDist = Infinity;
          enemy.positions.forEach(([x, y], idx) => {
            const d = Math.hypot(x - proj.x, y - proj.y);
            if (d < nearestDist) {
              nearestDist = d;
              nearest = idx;
            }
          });
          if (nearestDist < 0.9) {
            const correct = enemy.options[nearest].correct;
            if (correct) {
              p.resolvedEnemyIds.add(enemy.id);
              p.energy = Math.min(100, p.energy + UFO_ENERGY_GAIN);
              if (p.lives < MAX_LIVES) p.lives += 1;
              p.boostTimer = 1.6;
              callbacks.onLivesChange(p.lives);
              callbacks.onEnergyChange(p.energy);
            }
            callbacks.onEnemyResolved(enemy, correct);
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

    const activeEnemy = ENEMY_ENCOUNTERS.find((e) => !p.resolvedEnemyIds.has(e.id) && e.z - p.z < 30 && e.z - p.z > -2);
    const nextPrompt = activeEnemy?.prompt ?? null;
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

      {physicsRef.current.comets.map((c) => (
        <CometShardView key={c.id} x={c.x} y={c.y} z={c.z} />
      ))}

      {DEBRIS_PICKUPS.map((pk) => (
        <DebrisPickupView
          key={pk.id}
          pickup={pk}
          playerZ={physicsRef.current.z}
          shipX={physicsRef.current.x}
          shipY={physicsRef.current.y}
          collected={physicsRef.current.collectedDebrisIds.has(pk.id)}
        />
      ))}

      {physicsRef.current.pickupEffects.map((fx) => (
        <PickupBurst key={fx.id} x={fx.x} y={fx.y} z={fx.z} age={fx.age} />
      ))}

      {ENEMY_ENCOUNTERS.map((e) => (
        <EnemyTargets
          key={e.id}
          encounter={e}
          playerZ={physicsRef.current.z}
          shipX={physicsRef.current.x}
          shipY={physicsRef.current.y}
          resolved={physicsRef.current.resolvedEnemyIds.has(e.id)}
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
