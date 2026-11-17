import type { TrackObstacle, TrackCollectible, TrackGate, Track } from './trackData';
import type { WorldTheme } from './worldThemes';

/**
 * Static visuals for every obstacle, collectible and gate along the
 * track. Positions never change — only visibility toggles, driven by the
 * `hitIds`/`collectedIds`/`completedGates` sets, which only change on
 * discrete events (not every frame), so plain React props are fine here
 * even though the player's own movement is driven imperatively.
 */
export function TrackDecor({
  track,
  theme,
  hitIds,
  collectedIds,
  completedGates,
}: {
  track: Track;
  theme: WorldTheme;
  hitIds: Set<string>;
  collectedIds: Set<string>;
  completedGates: Set<string>;
}) {
  return (
    <>
      {track.obstacles.map((o) => (
        <ObstacleMesh key={o.id} obstacle={o} theme={theme} hit={hitIds.has(o.id)} />
      ))}
      {track.collectibles.map((c) => (
        <CollectibleMesh key={c.id} collectible={c} collected={collectedIds.has(c.id)} />
      ))}
      {track.gates.map((g) => (
        <GateMesh key={g.id} gate={g} theme={theme} completed={completedGates.has(g.levelId)} />
      ))}
      {/* The running path itself — wide in Z so it fills the angled camera
          view all the way to the horizon; Z never factors into collision,
          so there's no cost to making it generous. */}
      <mesh position={[400, -0.05, 0]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1600, 80]} />
        <meshStandardMaterial color={theme.ground} />
      </mesh>
    </>
  );
}

function ObstacleMesh({ obstacle, theme, hit }: { obstacle: TrackObstacle; theme: WorldTheme; hit: boolean }) {
  if (hit) return null;
  if (obstacle.kind === 'low') {
    if (obstacle.variant === 'fire') {
      // A ground-level fireball the chaser just lobbed at you — same jump
      // dodge as a plain box, but reads as a live hazard the world is
      // actively throwing, not just scenery to hop over.
      return (
        <group position={[obstacle.x, 0.5, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[0.42, 10, 10]} />
            <meshStandardMaterial color="#ff6a2d" emissive="#ff8a3d" emissiveIntensity={1.1} />
          </mesh>
          <mesh scale={[1.35, 1.35, 1.35]}>
            <sphereGeometry args={[0.42, 10, 10]} />
            <meshStandardMaterial color="#ff6a2d" emissive="#ff4d1a" emissiveIntensity={0.5} transparent opacity={0.3} />
          </mesh>
        </group>
      );
    }
    return (
      <mesh position={[obstacle.x, 0.45, 0]} castShadow>
        <boxGeometry args={[0.7, 0.9, 1.6]} />
        <meshStandardMaterial color={theme.obstacle} />
      </mesh>
    );
  }
  // 'high' — an overhead bar (or fire-arc) on two side posts, with a gap
  // to slide under.
  return (
    <group position={[obstacle.x, 0, 0]}>
      <mesh position={[0, -0.85, -0.7]}>
        <cylinderGeometry args={[0.08, 0.08, 1.2, 6]} />
        <meshStandardMaterial color="#8a8f9a" />
      </mesh>
      <mesh position={[0, -0.85, 0.7]}>
        <cylinderGeometry args={[0.08, 0.08, 1.2, 6]} />
        <meshStandardMaterial color="#8a8f9a" />
      </mesh>
      <mesh position={[0, 1.6, 0]}>
        <boxGeometry args={[0.2, 0.2, 1.7]} />
        <meshStandardMaterial
          color={obstacle.variant === 'fire' ? '#ff6a2d' : '#e24d4d'}
          emissive={obstacle.variant === 'fire' ? '#ff6a2d' : '#e24d4d'}
          emissiveIntensity={obstacle.variant === 'fire' ? 0.9 : 0.3}
        />
      </mesh>
    </group>
  );
}

function CollectibleMesh({ collectible, collected }: { collectible: TrackCollectible; collected: boolean }) {
  if (collected) return null;
  if (collectible.kind === 'coin') {
    return (
      <mesh position={[collectible.x, collectible.y, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.28, 0.1, 10, 16]} />
        <meshStandardMaterial color="#ffd84d" emissive="#ffb800" emissiveIntensity={0.3} />
      </mesh>
    );
  }
  if (collectible.kind === 'shield') {
    return (
      <mesh position={[collectible.x, collectible.y, 0]}>
        <octahedronGeometry args={[0.35, 0]} />
        <meshStandardMaterial color="#7fe8ff" emissive="#7fe8ff" emissiveIntensity={0.5} transparent opacity={0.85} />
      </mesh>
    );
  }
  return (
    <mesh position={[collectible.x, collectible.y, 0]} rotation={[0, 0, -Math.PI / 2]}>
      <coneGeometry args={[0.3, 0.6, 8]} />
      <meshStandardMaterial color="#ff8a4d" emissive="#ff6a2d" emissiveIntensity={0.5} />
    </mesh>
  );
}

function GateMesh({ gate, theme, completed }: { gate: TrackGate; theme: WorldTheme; completed: boolean }) {
  const color = completed ? '#4dffb0' : theme.gate;
  return (
    <group position={[gate.x, 0, 0]}>
      <mesh position={[-1, 1.1, 0]}>
        <boxGeometry args={[0.22, 2.2, 0.22]} />
        <meshStandardMaterial color="#2a2a3a" />
      </mesh>
      <mesh position={[1, 1.1, 0]}>
        <boxGeometry args={[0.22, 2.2, 0.22]} />
        <meshStandardMaterial color="#2a2a3a" />
      </mesh>
      <mesh position={[0, 2.15, 0]}>
        <boxGeometry args={[2.3, 0.22, 0.22]} />
        <meshStandardMaterial color="#2a2a3a" />
      </mesh>
      {!completed && (
        <mesh position={[0, 1.1, 0]}>
          <planeGeometry args={[1.9, 2]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} transparent opacity={0.55} side={2} />
        </mesh>
      )}
    </group>
  );
}
