import { forwardRef } from 'react';
import * as THREE from 'three';

/**
 * A simple original low-poly robot runner — primitives only, same house
 * style as the free-roam game's RobotCharacter, no external assets.
 * Its group ref is driven imperatively every frame by RunnerSceneContents
 * (position/rotation/squash), so this component itself holds no state.
 */
export const PlayerAvatar = forwardRef<THREE.Group>(function PlayerAvatar(_props, ref) {
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
      <mesh position={[0.35, 0.55, 0]} castShadow>
        <boxGeometry args={[0.18, 0.6, 0.3]} />
        <meshStandardMaterial color="#2f6fa8" />
      </mesh>
    </group>
  );
});
