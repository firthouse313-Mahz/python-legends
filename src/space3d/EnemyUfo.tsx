/** A small original UFO — flattened disc hull, glass dome, under-glow
 *  ring — so "enemy" is an actual recognizable hostile craft, not an
 *  abstract gem with text floating next to it. */
export function EnemyUfo({ hostile }: { hostile: boolean }) {
  return (
    <group>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.32, 0.42, 0.14, 16]} />
        <meshStandardMaterial color={hostile ? '#8a8a94' : '#5ce1e6'} metalness={0.3} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.14, 0]}>
        <sphereGeometry args={[0.18, 12, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#1c2a3a" emissive="#4fd8ff" emissiveIntensity={0.6} transparent opacity={0.85} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -0.04, 0]}>
        <torusGeometry args={[0.3, 0.035, 8, 20]} />
        <meshStandardMaterial
          color={hostile ? '#b5452f' : '#ffd166'}
          emissive={hostile ? '#ff3c2f' : '#ffd166'}
          emissiveIntensity={1.2}
        />
      </mesh>
    </group>
  );
}
