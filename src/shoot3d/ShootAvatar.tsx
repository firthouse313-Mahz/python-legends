import { forwardRef } from 'react';
import * as THREE from 'three';

/**
 * A blaster-armed variant of the Python Forest explorer — same primitive
 * house style as the free-roam RobotCharacter/PlayerAvatar, with a small
 * emitter nozzle on the right arm so the shooting mechanic reads visually,
 * not just mechanically.
 */
export const ShootAvatar = forwardRef<THREE.Group>(function ShootAvatar(_props, ref) {
  return (
    <group ref={ref}>
      <mesh position={[0, 0.55, 0]} castShadow>
        <boxGeometry args={[0.55, 0.75, 0.4]} />
        <meshStandardMaterial color="#4fd8ff" />
      </mesh>
      <mesh position={[0, 1.05, 0]} castShadow>
        <boxGeometry args={[0.42, 0.4, 0.42]} />
        <meshStandardMaterial color="#e8fbff" />
      </mesh>
      <mesh position={[0, 1.07, 0.21]}>
        <boxGeometry args={[0.28, 0.12, 0.04]} />
        <meshStandardMaterial color="#1c2a3a" emissive="#4fd8ff" emissiveIntensity={0.6} />
      </mesh>
      <mesh position={[-0.35, 0.55, 0]} castShadow>
        <boxGeometry args={[0.18, 0.6, 0.3]} />
        <meshStandardMaterial color="#2f6fa8" />
      </mesh>
      {/* right arm + blaster */}
      <mesh position={[0.35, 0.55, 0]} castShadow>
        <boxGeometry args={[0.18, 0.6, 0.3]} />
        <meshStandardMaterial color="#2f6fa8" />
      </mesh>
      <mesh position={[0.35, 0.55, 0.3]} castShadow>
        <boxGeometry args={[0.14, 0.14, 0.32]} />
        <meshStandardMaterial color="#ffd166" emissive="#ff9a3c" emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
});
