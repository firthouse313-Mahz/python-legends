import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { ShootAvatar } from './ShootAvatar';
import { currentSpeed, MISS_ENERGY_COST, type ShootPhysics, BOOST_DURATION } from './shootPhysics';
import { Chaser } from '../runner/Chaser';
import { PYTHON_FOREST_GATES, LEVEL_END_Z, type ShootGate } from './shootGates';

export interface ShootSceneCallbacks {
  onGateHit: (gate: ShootGate, correct: boolean) => void;
  onLevelComplete: () => void;
  onEnergyChange: (energy: number) => void;
}

const JUMP_VY = 7.2;
const GRAVITY = -19;

// Mirrors Chaser's own RunnerPhysics shape just enough to drive it off this
// game's own energy value — keeps the pursuing-threat identity Python
// Legends already has, instead of borrowing SQL Quest's flat countdown-only
// tension.
interface ChaserAdapter {
  x: number;
  energy: number;
}

function BugTargets({ gate, playerZ, selected, hitIds }: { gate: ShootGate; playerZ: number; selected: number; hitIds: Set<string> }) {
  const dz = gate.z - playerZ;
  if (dz < -4 || dz > 30 || hitIds.has(gate.id)) return null;
  const opacity = dz > 18 ? Math.max(0, 1 - (dz - 18) / 12) : 1;
  return (
    <group position={[0, 0, -gate.z]}>
      {gate.options.map((opt, i) => {
        const [x, y] = gate.positions[i];
        const isSelected = i === selected;
        return (
          <group key={i} position={[x, y, 0]}>
            {isSelected && (
              <mesh rotation={[0, 0, Math.PI / 4]}>
                <ringGeometry args={[0.42, 0.5, 4]} />
                <meshBasicMaterial color="#ffd166" transparent opacity={opacity} />
              </mesh>
            )}
            <mesh>
              <icosahedronGeometry args={[0.32, 0]} />
              <meshStandardMaterial
                color={opt.correct ? '#2fae4a' : '#b5452f'}
                emissive={opt.correct ? '#1c7f3a' : '#7a2e2e'}
                emissiveIntensity={0.5}
                transparent
                opacity={opacity * 0.95}
              />
            </mesh>
            <Html center distanceFactor={6} style={{ opacity, pointerEvents: 'none', width: 120 }}>
              <div className="sd-bug-label">{opt.text}</div>
            </Html>
          </group>
        );
      })}
      <Html position={[0, 3.4, 0]} center distanceFactor={6} style={{ opacity, pointerEvents: 'none' }}>
        <div className="sd-sign-prompt">{gate.prompt}</div>
      </Html>
    </group>
  );
}

export function ShootScene({
  physicsRef,
  callbacks,
  fireApiRef,
}: {
  physicsRef: React.RefObject<ShootPhysics>;
  callbacks: ShootSceneCallbacks;
  fireApiRef: React.MutableRefObject<(() => void) | null>;
}) {
  const playerRef = useRef<THREE.Group>(null);
  const projectileRefs = useRef<Map<number, THREE.Object3D>>(new Map());
  const chaserAdapterRef = useRef<ChaserAdapter>({ x: 0, energy: 100 });
  const { camera } = useThree();
  const vy = useRef(0);
  const grounded = useRef(true);
  const playerY = useRef(0);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const p = physicsRef.current;
      if (p.paused) return;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') p.aim = ((p.aim + 2) % 3) as 0 | 1 | 2;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') p.aim = ((p.aim + 1) % 3) as 0 | 1 | 2;
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        if (grounded.current) {
          vy.current = JUMP_VY;
          grounded.current = false;
        }
      }
      if (e.key === 'f' || e.key === 'F' || e.key === 'Enter') fire();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [physicsRef]);

  function fire() {
    const p = physicsRef.current;
    if (p.paused) return;
    const nextGate = PYTHON_FOREST_GATES.find((g) => !p.passedGateIds.has(g.id) && g.z - p.z < 22 && g.z - p.z > -2);
    if (!nextGate) return;
    const [tx, ty] = nextGate.positions[p.aim];
    p.projectiles.push({
      id: p.nextProjectileId++,
      fromX: 0.35,
      fromY: 0.55,
      targetX: tx,
      targetY: ty,
      z: nextGate.z,
      startZ: p.z,
      t: 0,
    });
  }
  fireApiRef.current = fire;

  useFrame((_, dtRaw) => {
    const p = physicsRef.current;
    const dt = Math.min(dtRaw, 0.05);
    if (p.paused) return;

    if (p.boostTimer > 0) p.boostTimer = Math.max(0, p.boostTimer - dt);
    if (p.bumpTimer > 0) p.bumpTimer = Math.max(0, p.bumpTimer - dt);

    p.z += currentSpeed(p) * dt;

    vy.current += GRAVITY * dt;
    playerY.current += vy.current * dt;
    if (playerY.current <= 0) {
      playerY.current = 0;
      vy.current = 0;
      grounded.current = true;
    }

    for (let i = p.projectiles.length - 1; i >= 0; i--) {
      const proj = p.projectiles[i];
      proj.t += dt * 2.6;
      if (proj.t >= 1) {
        const gate = PYTHON_FOREST_GATES.find((g) => g.z === proj.z);
        if (gate && !p.passedGateIds.has(gate.id)) {
          p.passedGateIds.add(gate.id);
          const hitIndex = gate.positions.findIndex(([x, y]) => x === proj.targetX && y === proj.targetY);
          const correct = gate.options[hitIndex]?.correct ?? false;
          if (correct) {
            p.boostTimer = BOOST_DURATION;
          } else {
            p.bumpTimer = 0.3;
            p.energy = Math.max(0, p.energy - MISS_ENERGY_COST);
            callbacks.onEnergyChange(p.energy);
          }
          callbacks.onGateHit(gate, correct);
        }
        p.projectiles.splice(i, 1);
        projectileRefs.current.delete(proj.id);
      }
    }

    if (p.z >= LEVEL_END_Z) {
      p.paused = true;
      callbacks.onLevelComplete();
    }

    if (playerRef.current) {
      playerRef.current.position.set(0, playerY.current, -p.z);
      playerRef.current.rotation.x = grounded.current ? 0 : 0.15;
    }
    camera.position.set(0, playerY.current + 2.2, -p.z + 5.2);
    camera.lookAt(0, playerY.current + 1.4, -p.z - 2);

    for (const proj of p.projectiles) {
      const obj = projectileRefs.current.get(proj.id);
      if (obj) {
        const worldZ = -(proj.startZ + (proj.z - proj.startZ) * proj.t);
        const x = proj.fromX + (proj.targetX - proj.fromX) * proj.t;
        const y = proj.fromY + (proj.targetY - proj.fromY) * proj.t;
        obj.position.set(x, y, worldZ);
      }
    }

    // drive the pursuing Chaser off this game's own energy (closes in as
    // misses pile up) — the same pressure device Python Legends' main
    // runner already uses, so this mode still reads as "Python Legends."
    chaserAdapterRef.current.x = p.z;
    chaserAdapterRef.current.energy = p.energy;
  });

  return (
    <>
      <ambientLight intensity={0.85} />
      <directionalLight position={[12, 20, 10]} intensity={1.1} castShadow />
      <fog attach="fog" args={['#8fe3ff', 20, 52]} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, -LEVEL_END_Z / 2]} receiveShadow>
        <planeGeometry args={[7, LEVEL_END_Z + 30]} />
        <meshStandardMaterial color="#3f8f52" />
      </mesh>
      {/* scattered forest trees for depth, unlike SQL Quest's open road */}
      {Array.from({ length: 24 }).map((_, i) => {
        const side = i % 2 === 0 ? -1 : 1;
        const tz = -(6 + Math.floor(i / 2) * 9);
        const tx = side * (2.6 + (i % 3) * 0.6);
        return (
          <mesh key={i} position={[tx, 1, tz]}>
            <coneGeometry args={[0.7, 2.1, 7]} />
            <meshStandardMaterial color={i % 3 === 0 ? '#2f8f52' : '#3c9c69'} />
          </mesh>
        );
      })}

      {PYTHON_FOREST_GATES.map((g) => (
        <BugTargets
          key={g.id}
          gate={g}
          playerZ={physicsRef.current.z}
          selected={physicsRef.current.aim}
          hitIds={physicsRef.current.passedGateIds}
        />
      ))}

      {physicsRef.current.projectiles.map((proj) => (
        <mesh
          key={proj.id}
          ref={(el) => {
            if (el) projectileRefs.current.set(proj.id, el);
          }}
        >
          <sphereGeometry args={[0.13, 10, 10]} />
          <meshStandardMaterial color="#ffd166" emissive="#ff9a3c" emissiveIntensity={1} />
        </mesh>
      ))}

      <group position={[0, 0, -LEVEL_END_Z]}>
        <mesh position={[0, 1.4, 0]}>
          <torusGeometry args={[1.3, 0.14, 10, 28]} />
          <meshStandardMaterial color="#5ce1e6" emissive="#1c9dff" emissiveIntensity={1.4} />
        </mesh>
      </group>

      <Chaser physicsRef={chaserAdapterRef as unknown as React.RefObject<any>} color="#b5452f" />

      <group ref={playerRef}>
        <ShootAvatar />
      </group>
    </>
  );
}
