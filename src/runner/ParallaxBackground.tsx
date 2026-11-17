import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { RunnerPhysics } from './physics';

/**
 * Three looping background layers at different depths/speeds for a cheap
 * parallax effect — no texture images (none can be fetched in this
 * sandbox), just colored primitives recycled along X as the player runs.
 */
export function ParallaxBackground({ physicsRef }: { physicsRef: React.RefObject<RunnerPhysics> }) {
  const farRef = useRef<THREE.Group>(null);
  const midRef = useRef<THREE.Group>(null);
  const nearRef = useRef<THREE.Group>(null);

  useFrame(() => {
    const x = physicsRef.current.x;
    if (farRef.current) farRef.current.position.x = -x * 0.15;
    if (midRef.current) midRef.current.position.x = -x * 0.4;
    if (nearRef.current) nearRef.current.position.x = -x * 0.75;
  });

  const farHills = Array.from({ length: 10 }, (_, i) => i * 24 - 48);
  const midTrees = Array.from({ length: 16 }, (_, i) => i * 9 - 36);
  const nearBushes = Array.from({ length: 20 }, (_, i) => i * 6 - 30);

  return (
    <>
      <mesh position={[0, 6, -40]}>
        <planeGeometry args={[400, 40]} />
        <meshBasicMaterial color="#8fe3ff" />
      </mesh>
      <group ref={farRef} position={[0, 0, -30]}>
        {farHills.map((x, i) => (
          <mesh key={i} position={[x, -2, 0]}>
            <sphereGeometry args={[9, 10, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#4fae7a" />
          </mesh>
        ))}
      </group>
      <group ref={midRef} position={[0, 0, -16]}>
        {midTrees.map((x, i) => (
          <group key={i} position={[x, 0, (i % 2) * 2 - 1]}>
            <mesh position={[0, 1.6, 0]}>
              <coneGeometry args={[1.4, 3.2, 7]} />
              <meshStandardMaterial color="#2f8f52" />
            </mesh>
            <mesh position={[0, 0.3, 0]}>
              <cylinderGeometry args={[0.25, 0.3, 0.7, 6]} />
              <meshStandardMaterial color="#5b3a22" />
            </mesh>
          </group>
        ))}
      </group>
      <group ref={nearRef} position={[0, -0.6, -6]}>
        {nearBushes.map((x, i) => (
          <mesh key={i} position={[x, 0, (i % 3) * 1.2 - 1]}>
            <sphereGeometry args={[0.6, 8, 8]} />
            <meshStandardMaterial color="#3fa15f" />
          </mesh>
        ))}
      </group>
    </>
  );
}
