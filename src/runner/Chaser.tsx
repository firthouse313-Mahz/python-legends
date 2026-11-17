import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { RunnerPhysics } from './physics';

/**
 * A pursuing presence just behind the player — purely visual (it never
 * touches collision), but its distance reacts to the player's own energy
 * in physicsRef, so taking hits visibly brings it closer: the chase gets
 * tighter exactly when the run is already going badly, instead of being a
 * fixed decoration. Full energy keeps it at a safe distance; near zero,
 * it's right on your heels.
 */
export function Chaser({
  physicsRef,
  color,
}: {
  physicsRef: React.RefObject<RunnerPhysics>;
  color: string;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const bobRef = useRef(0);

  useFrame((_, dt) => {
    const p = physicsRef.current;
    if (!groupRef.current) return;
    bobRef.current += dt * 6;
    const energyRatio = Math.max(0, Math.min(1, p.energy / 100));
    // 4.2 units back at full energy, closing to 1.4 units back as energy
    // runs out — close enough by the time a hit would respawn you that it
    // visibly reads as "it nearly got you."
    const distance = 1.4 + energyRatio * 2.8;
    groupRef.current.position.set(p.x - distance, 0.5 + Math.sin(bobRef.current) * 0.08, 0);
    const scare = 1 + (1 - energyRatio) * 0.25;
    groupRef.current.scale.set(scare, scare, scare);
  });

  return (
    <group ref={groupRef}>
      {/* Soft outer glow so it reads at a glance even against a dark or
          shadowed patch of track, instead of only the eyes being visible. */}
      <mesh scale={[1.5, 1.5, 1.5]}>
        <coneGeometry args={[0.5, 1.1, 5]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} transparent opacity={0.28} />
      </mesh>
      <mesh castShadow>
        <coneGeometry args={[0.5, 1.1, 5]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.85} />
      </mesh>
      <mesh position={[0.18, 0.18, 0.3]}>
        <sphereGeometry args={[0.07, 8, 8]} />
        <meshStandardMaterial color="#fff6e0" emissive="#fff6e0" emissiveIntensity={1.8} />
      </mesh>
      <mesh position={[-0.18, 0.18, 0.3]}>
        <sphereGeometry args={[0.07, 8, 8]} />
        <meshStandardMaterial color="#fff6e0" emissive="#fff6e0" emissiveIntensity={1.8} />
      </mesh>
    </group>
  );
}
