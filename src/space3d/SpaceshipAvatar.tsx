import { forwardRef } from 'react';
import * as THREE from 'three';

/** A small original low-poly cleanup-ship — primitives only, same house
 *  style as the game's other avatars. Distinct silhouette (wedge hull +
 *  wing fins + engine glow) so the space mode reads as its own vehicle,
 *  not a reskinned runner character. */
export const SpaceshipAvatar = forwardRef<THREE.Group>(function SpaceshipAvatar(_props, ref) {
  return (
    <group ref={ref} rotation={[0, Math.PI, 0]}>
      <mesh castShadow>
        <coneGeometry args={[0.32, 0.9, 4]} />
        <meshStandardMaterial color="#eafbff" />
      </mesh>
      <mesh position={[0, -0.1, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <boxGeometry args={[0.95, 0.08, 0.5]} />
        <meshStandardMaterial color="#4fd8ff" />
      </mesh>
      <mesh position={[0, -0.5, 0]}>
        <coneGeometry args={[0.16, 0.3, 8]} />
        <meshStandardMaterial color="#ff9a3c" emissive="#ff6a1c" emissiveIntensity={1.4} />
      </mesh>
    </group>
  );
});
