import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { PlayerAvatar } from './PlayerAvatar';
import { ParallaxBackground } from './ParallaxBackground';
import { TrackDecor } from './TrackDecor';
import { BossArena } from './BossArena';
import type { Track, TrackGate } from './trackData';
import type { WorldTheme } from './worldThemes';
import { Chaser } from './Chaser';
import {
  type RunnerPhysics,
  speedAt,
  BOOST_SPEED_MULT,
  GRAVITY,
  JUMP_VY,
  DOUBLE_JUMP_VY,
  JUMP_CLEAR_Y,
  SLIDE_DURATION,
  OBSTACLE_HIT_RADIUS,
  COLLECT_RADIUS,
} from './physics';
import type { RunnerControls } from './runnerControls';

export interface RunnerSceneCallbacks {
  onHit: (shieldAbsorbed: boolean) => void;
  onCollect: (kind: 'coin' | 'shield' | 'boost') => void;
  onReachGate: (gate: TrackGate) => void;
  onReachBoss: () => void;
  onDepleted: () => void;
  onTouchdown: () => void;
  bossHitsLanded: number;
  bossTotalHits: number;
  bossDefeated: boolean;
}

export function RunnerSceneContents({
  track,
  theme,
  physicsRef,
  controls,
  callbacks,
}: {
  track: Track;
  theme: WorldTheme;
  physicsRef: React.RefObject<RunnerPhysics>;
  controls: RunnerControls;
  callbacks: RunnerSceneCallbacks;
}) {
  const playerGroupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();

  useEffect(() => {
    const offJump = controls.onJump(() => {
      physicsRef.current.jumpQueued = true;
    });
    const offSlide = controls.onSlide(() => {
      physicsRef.current.slideQueued = true;
    });
    return () => {
      offJump();
      offSlide();
    };
  }, [controls, physicsRef]);

  useFrame((_, dtRaw) => {
    const p = physicsRef.current;
    const dt = Math.min(dtRaw, 0.05); // clamp huge stalls (tab switch, asset hiccups)

    if (p.flashTimer > 0) p.flashTimer = Math.max(0, p.flashTimer - dt);

    if (!p.paused) {
      // --- jump / double jump ---
      if (p.jumpQueued) {
        if (p.grounded) {
          p.vy = JUMP_VY;
          p.grounded = false;
          p.doubleJumpUsed = false;
        } else if (!p.doubleJumpUsed) {
          p.vy = DOUBLE_JUMP_VY;
          p.doubleJumpUsed = true;
        }
        p.jumpQueued = false;
      }
      // --- slide ---
      if (p.slideQueued) {
        if (p.grounded && !p.sliding) {
          p.sliding = true;
          p.slideTimer = SLIDE_DURATION;
        }
        p.slideQueued = false;
      }
      if (p.sliding) {
        p.slideTimer -= dt;
        if (p.slideTimer <= 0) p.sliding = false;
      }

      // --- vertical physics ---
      p.vy += GRAVITY * dt;
      p.y += p.vy * dt;
      if (p.y <= 0) {
        if (!p.grounded) callbacks.onTouchdown();
        p.y = 0;
        p.vy = 0;
        p.grounded = true;
      }

      // --- forward movement ---
      if (p.boostTimer > 0) p.boostTimer = Math.max(0, p.boostTimer - dt);
      const speed = speedAt(p.x, track.trackEndX, theme.speedMult) * (p.boostTimer > 0 ? BOOST_SPEED_MULT : 1);
      p.x = Math.min(track.trackEndX, p.x + speed * dt);

      // --- obstacle collisions ---
      for (const o of track.obstacles) {
        if (p.hitIds.has(o.id)) continue;
        if (Math.abs(o.x - p.x) > OBSTACLE_HIT_RADIUS) continue;
        const cleared = o.kind === 'low' ? p.y >= JUMP_CLEAR_Y : p.sliding;
        if (cleared) continue;
        p.hitIds.add(o.id);
        const shieldAbsorbed = p.shield;
        if (shieldAbsorbed) {
          p.shield = false;
        } else {
          p.x = Math.max(0, p.x - 1.4);
        }
        p.flashTimer = 0.3;
        callbacks.onHit(shieldAbsorbed);
      }

      // --- collectibles ---
      for (const c of track.collectibles) {
        if (p.collectedIds.has(c.id)) continue;
        if (Math.abs(c.x - p.x) > COLLECT_RADIUS) continue;
        p.collectedIds.add(c.id);
        if (c.kind === 'shield') p.shield = true;
        if (c.kind === 'boost') p.boostTimer = 3.5;
        callbacks.onCollect(c.kind);
      }

      // --- gates ---
      for (const gate of track.gates) {
        if (p.completedGates.has(gate.levelId)) continue;
        if (p.x >= gate.x - 1.3) {
          p.x = gate.x - 1.3;
          p.paused = true;
          callbacks.onReachGate(gate);
          break;
        }
      }

      // --- boss arena ---
      if (!p.paused && p.completedGates.size >= track.gates.length && !callbacks.bossDefeated && p.x >= track.bossArenaX - 3) {
        p.x = track.bossArenaX - 3;
        p.paused = true;
        callbacks.onReachBoss();
      }
    }

    // --- apply to the actual 3D objects ---
    if (playerGroupRef.current) {
      playerGroupRef.current.position.set(p.x, p.y, 0);
      const tilt = p.sliding ? -0.9 : p.grounded ? 0 : 0.18;
      playerGroupRef.current.rotation.x = tilt;
      const squash = p.sliding ? 0.55 : p.flashTimer > 0 ? 1 + Math.sin(p.flashTimer * 40) * 0.08 : 1;
      playerGroupRef.current.scale.set(1, squash, 1);
    }
    camera.position.set(p.x - 6.2, p.y + 2.6, 7.5);
    camera.lookAt(p.x + 2.5, p.y + 1, 0);
  });

  return (
    <>
      <ambientLight intensity={0.85} />
      <directionalLight position={[20, 25, 15]} intensity={1.1} castShadow />
      <ParallaxBackground physicsRef={physicsRef} theme={theme} />
      <TrackDecor
        track={track}
        theme={theme}
        hitIds={physicsRef.current.hitIds}
        collectedIds={physicsRef.current.collectedIds}
        completedGates={physicsRef.current.completedGates}
      />
      <BossArena
        x={track.bossArenaX}
        hitsLanded={callbacks.bossHitsLanded}
        totalHits={callbacks.bossTotalHits}
        defeated={callbacks.bossDefeated}
      />
      <Chaser physicsRef={physicsRef} color={theme.chaser} />
      <PlayerAvatar ref={playerGroupRef} />
    </>
  );
}
