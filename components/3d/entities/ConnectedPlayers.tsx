'use client';

import React, { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, useGLTF } from '@react-three/drei';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import * as THREE from 'three';
import { RoomPlayer, PlayerRole } from '@/types';

interface ConnectedPlayersProps {
  players: RoomPlayer[];
  currentPlayerId?: string;
}

// Preset physical Citadel coordinates and rotations for up to 10 player entities
// Balanced across the Grand Courtyard so every human is visible and believable
const ROLE_CONFIGS: Record<
  PlayerRole,
  { pos: [number, number, number]; rot: [number, number, number] }[]
> = {
  commander_vale: [
    { pos: [-4.2, 0, 4.5], rot: [0, 0.4, 0] },
  ],
  player_7: [
    { pos: [3.2, 0, 5.0], rot: [0, -0.3, 0] }, // Rendered via Player7 humanoid
  ],
  gatekeeper: [
    { pos: [-1.4, 0, 9.2], rot: [0, 0.15, 0] },
  ],
  surgeon: [
    { pos: [-3.8, 0, 7.5], rot: [0, 0.45, 0] },
  ],
  observer: [
    { pos: [4.6, 0, 8.2], rot: [0, -0.4, 0] },
    { pos: [-4.6, 0, 9.4], rot: [0, 0.45, 0] },
    { pos: [5.4, 0, 11.2], rot: [0, -0.55, 0] },
    { pos: [-3.2, 0, 12.0], rot: [0, 0.3, 0] },
    { pos: [2.6, 0, 12.8], rot: [0, -0.2, 0] },
    { pos: [-1.8, 0, 13.8], rot: [0, 0.15, 0] },
  ],
};

const ROLE_COLORS: Record<PlayerRole, string> = {
  commander_vale: '#d4a017', // Gold / Commander
  player_7: '#cc785c',       // Coral / The Invariant
  gatekeeper: '#5db872',     // Green / Gatekeeper
  surgeon: '#60a5fa',        // Blue / Forensic Surgeon
  observer: '#a09d96',       // Warm Grey / Observer
};

function HumanPlayer({
  player,
  position,
  rotation,
  isCurrent,
}: {
  player: RoomPlayer;
  position: [number, number, number];
  rotation: [number, number, number];
  isCurrent: boolean;
}) {
  const { scene } = useGLTF('/models/readyplayer.me.glb');

  // Clone rigged skinned mesh model using SkeletonUtils so each human has an independent bone skeleton
  const clonedScene = useMemo(() => {
    const c = clone(scene);
    c.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    return c;
  }, [scene]);

  const spineNode = useRef<THREE.Object3D | null>(null);
  const headNode = useRef<THREE.Object3D | null>(null);

  useEffect(() => {
    clonedScene.traverse((child) => {
      if (child.name === 'Spine1' || child.name === 'Spine2') {
        spineNode.current = child;
      }
      if (child.name === 'Head') {
        headNode.current = child;
      }
    });
  }, [clonedScene]);

  // Unique natural breathing phase offset per player so humans don't sway in robotic synchrony
  const phaseOffset = useMemo(() => {
    let hash = 0;
    for (let i = 0; i < player.id.length; i++) {
      hash = (hash + player.id.charCodeAt(i)) % 100;
    }
    return hash * 0.15;
  }, [player.id]);

  useFrame(({ clock }) => {
    const elapsed = clock.getElapsedTime() + phaseOffset;
    // Human chest breathing
    if (spineNode.current) {
      spineNode.current.rotation.x = Math.sin(elapsed * 1.5) * 0.02;
    }
    // Subtle head glance / alertness
    if (headNode.current) {
      headNode.current.rotation.y = Math.sin(elapsed * 0.7) * 0.035;
    }
  });

  const roleColor = ROLE_COLORS[player.role] || '#cc785c';
  const isLeftSide = position[0] < 0;
  // Offset horizontally to the side so the human body, head, and face are 100% UNHIDDEN
  const cardOffset: [number, number, number] = isLeftSide ? [-1.3, 2.4, 0] : [1.3, 2.4, 0];

  return (
    <group position={position} rotation={rotation}>
      {/* ── Realistic Humanoid 3D Model ── */}
      <primitive
        object={clonedScene}
        scale={1.8}
        position={[0, 0, 0]}
      />

      {/* ── Ground Alignment Entity Ring (Subtle colored ring under feet) ── */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.35, 0.44, 32]} />
        <meshBasicMaterial color={roleColor} transparent opacity={0.65} />
      </mesh>

      {/* ── Non-Obstructing Floating Nameplate & Role Badge ── */}
      {/* Offset to the side of the character with connector line so face is NEVER obscured */}
      <Html position={cardOffset} zIndexRange={[100, 0]} distanceFactor={14}>
        <div className="relative pointer-events-auto select-none">
          <div
            className={`flex items-center gap-1.5 whitespace-nowrap ${
              isLeftSide ? 'flex-row-reverse' : ''
            }`}
          >
            {/* Subtle connector indicator from player to badge */}
            <div
              className="w-4 h-[1px] flex-shrink-0"
              style={{ backgroundColor: `${roleColor}99` }}
            />

            <div
              className={`bg-[#14181c]/95 backdrop-blur-md border border-[#2d3742] px-2.5 py-1.5 rounded-sm shadow-xl min-w-[130px] ${
                isLeftSide ? 'border-r-2 text-right' : 'border-l-2 text-left'
              }`}
              style={isLeftSide ? { borderRightColor: roleColor } : { borderLeftColor: roleColor }}
            >
              <div
                className={`flex items-center gap-2 mb-0.5 whitespace-nowrap ${
                  isLeftSide ? 'justify-end' : 'justify-between'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  {!isLeftSide && (
                    <span
                      className="w-2 h-2 rounded-full animate-pulse flex-shrink-0"
                      style={{
                        backgroundColor: player.connected ? '#5db872' : '#8e8b82',
                      }}
                    />
                  )}
                  <span className="text-[10px] font-mono font-semibold text-[#faf9f5]">
                    {player.name}
                  </span>
                  {isLeftSide && (
                    <span
                      className="w-2 h-2 rounded-full animate-pulse flex-shrink-0"
                      style={{
                        backgroundColor: player.connected ? '#5db872' : '#8e8b82',
                      }}
                    />
                  )}
                </div>

                {isCurrent && (
                  <span className="text-[7px] font-mono px-1 py-0.2 rounded bg-[#cc785c]/30 text-[#cc785c] font-bold">
                    YOU
                  </span>
                )}
              </div>

              <div
                className="text-[8px] font-mono font-semibold uppercase tracking-wider whitespace-nowrap"
                style={{ color: roleColor }}
              >
                {player.roleLabel}
              </div>
            </div>
          </div>
        </div>
      </Html>
    </group>
  );
}

export function ConnectedPlayers({ players, currentPlayerId }: ConnectedPlayersProps) {
  let observerIndex = 0;

  return (
    <group>
      {players.map((player) => {
        // Player 7 is rendered with full humanoid avatar via Player7.tsx
        if (player.role === 'player_7') return null;

        let config: { pos: [number, number, number]; rot: [number, number, number] };
        if (player.role === 'observer') {
          const obsList = ROLE_CONFIGS.observer;
          config = obsList[observerIndex % obsList.length];
          observerIndex++;
        } else {
          config = ROLE_CONFIGS[player.role]?.[0] || {
            pos: [-2.0, 0, 8.0],
            rot: [0, 0, 0],
          };
        }

        return (
          <HumanPlayer
            key={player.id}
            player={player}
            position={config.pos}
            rotation={config.rot}
            isCurrent={player.id === currentPlayerId}
          />
        );
      })}
    </group>
  );
}

// Preload the humanoid ReadyPlayerMe model for instantaneous rendering
useGLTF.preload('/models/readyplayer.me.glb');
