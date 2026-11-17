import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * The world's boss monster — a simple original low-poly creature (no
 * external assets), built from primitives, that lumbers and reacts when
 * hit. `hitsLanded` drives its health and a defeat animation.
 */
export function BossArena({
  x,
  hitsLanded,
  totalHits,
  defeated,
}: {
  x: number;
  hitsLanded: number;
  totalHits: number;
  defeated: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    if (defeated) {
      groupRef.current.position.y = Math.max(-2.5, groupRef.current.position.y - 0.03);
      groupRef.current.rotation.z += 0.04;
      return;
    }
    groupRef.current.position.y = Math.sin(t * 2) * 0.12;
    groupRef.current.rotation.y = Math.sin(t * 0.8) * 0.2;
    if (bodyRef.current) {
      const s = 1 + Math.sin(t * 2) * 0.03;
      bodyRef.current.scale.set(s, s, s);
    }
  });

  const health = Math.max(0, totalHits - hitsLanded);
  const color = health >= totalHits ? '#9b3bd6' : health > totalHits / 2 ? '#c74a8f' : '#e26a5a';

  return (
    <group position={[x, 0, -1]}>
      <group ref={groupRef}>
        <mesh ref={bodyRef} position={[0, 1.4, 0]} castShadow>
          <icosahedronGeometry args={[1.3, 0]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.25} />
        </mesh>
        <mesh position={[-0.5, 1.7, 1.1]}>
          <sphereGeometry args={[0.22, 8, 8]} />
          <meshStandardMaterial color="#fff" />
        </mesh>
        <mesh position={[0.5, 1.7, 1.1]}>
          <sphereGeometry args={[0.22, 8, 8]} />
          <meshStandardMaterial color="#fff" />
        </mesh>
        <mesh position={[-0.5, 1.7, 1.25]}>
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshStandardMaterial color="#1a1a1a" />
        </mesh>
        <mesh position={[0.5, 1.7, 1.25]}>
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshStandardMaterial color="#1a1a1a" />
        </mesh>
      </group>
      {/* Arena floor marker */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.6, 3, 32]} />
        <meshStandardMaterial color={defeated ? '#4dffb0' : '#e24d4d'} emissive={defeated ? '#4dffb0' : '#e24d4d'} emissiveIntensity={0.4} />
      </mesh>
    </group>
  );
}
