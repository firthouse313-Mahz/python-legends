import { forwardRef } from 'react';
import * as THREE from 'three';

/** A real-metal ship silhouette, oriented nose-up / engines-toward-
 *  camera — deliberately NOT nose-forward, because this game's chase
 *  camera sits behind and above the ship: a nose-forward design (like
 *  a dish-forward probe) shows only its back to the camera and reads
 *  as a flat disc. This orientation puts the wings and the glowing
 *  engine cluster facing the camera, which is what actually reads as
 *  "a ship flying away from you" from this viewing angle, while still
 *  using real PBR metal/glass shading (not flat cartoon colors) for
 *  the surface detail itself.
 *
 *  The extra Math.PI on X (on top of the authoring-convention Math.PI
 *  on Y) exists only to cancel out SpaceScene's own constant 180° X
 *  flip on the ship's outer wrapper group (used for its banking tilt)
 *  — without it, nose/engine placement renders upside down. */
export const SpaceshipAvatar = forwardRef<THREE.Group>(function SpaceshipAvatar(_props, ref) {
  return (
    <group ref={ref} rotation={[Math.PI, Math.PI, 0]}>
      {/* fuselage — tapered brushed-metal body */}
      <mesh castShadow position={[0, 0.04, 0]}>
        <cylinderGeometry args={[0.035, 0.17, 1.05, 14]} />
        <meshStandardMaterial color="#aab4c2" metalness={0.75} roughness={0.3} />
      </mesh>
      {/* nose cap */}
      <mesh position={[0, 0.58, 0]}>
        <coneGeometry args={[0.035, 0.16, 14]} />
        <meshStandardMaterial color="#eef3f8" metalness={0.5} roughness={0.22} />
      </mesh>
      {/* cockpit canopy — tinted glass */}
      <mesh position={[0, 0.24, 0.08]} rotation={[0.55, 0, 0]}>
        <sphereGeometry args={[0.1, 14, 10, 0, Math.PI * 2, 0, Math.PI / 1.7]} />
        <meshStandardMaterial
          color="#163241"
          emissive="#4fd8ff"
          emissiveIntensity={0.5}
          transparent
          opacity={0.85}
          metalness={0.2}
          roughness={0.15}
        />
      </mesh>
      {/* panel seams — thin dark rings around the fuselage for surface detail */}
      {[0.32, 0.0, -0.3].map((py, i) => (
        <mesh key={i} position={[0, py, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[py > 0.1 ? 0.1 : py < -0.1 ? 0.14 : 0.145, 0.006, 6, 24]} />
          <meshStandardMaterial color="#5c6675" metalness={0.6} roughness={0.5} />
        </mesh>
      ))}
      {/* swept delta wings, left + right, with a glowing accent stripe */}
      {[-1, 1].map((side) => (
        <group key={side} position={[0, -0.06, 0]} rotation={[0, 0, side * -0.22]}>
          <mesh position={[0.32 * side, -0.04, 0]} rotation={[0, side * 0.2, 0]}>
            <boxGeometry args={[0.5, 0.025, 0.3]} />
            <meshStandardMaterial color="#3a4452" metalness={0.55} roughness={0.4} />
          </mesh>
          <mesh position={[0.32 * side, -0.027, 0.11]} rotation={[0, side * 0.2, 0]}>
            <boxGeometry args={[0.44, 0.012, 0.05]} />
            <meshStandardMaterial color="#ff9a3c" emissive="#ff6a1c" emissiveIntensity={0.9} />
          </mesh>
        </group>
      ))}
      {/* twin engine nacelles + thruster glow, facing the chase camera */}
      {[-1, 1].map((side) => (
        <group key={`eng-${side}`} position={[0.13 * side, -0.46, -0.02]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.065, 0.075, 0.22, 12]} />
            <meshStandardMaterial color="#5c6675" metalness={0.6} roughness={0.35} />
          </mesh>
          <mesh position={[0, -0.15, 0]}>
            <coneGeometry args={[0.05, 0.19, 12]} />
            <meshStandardMaterial color="#4fd8ff" emissive="#1c9dff" emissiveIntensity={1.7} />
          </mesh>
        </group>
      ))}
    </group>
  );
});
