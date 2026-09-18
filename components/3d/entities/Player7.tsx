'use client';

import React, { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

interface Player7Props {
  position?: [number, number, number];
  invariantStatus: 'active' | 'compressed' | 'dropped' | 'restored' | 'none';
  onClick?: () => void;
  showCard?: boolean;
  playerName?: string;
  isCurrent?: boolean;
}

export function Player7({
  position = [0, 0, 0],
  invariantStatus,
  onClick,
  showCard = true,
  playerName,
  isCurrent,
}: Player7Props) {
  const haloRef = useRef<THREE.Mesh>(null);
  const spineNode = useRef<THREE.Object3D | null>(null);
  const headNode = useRef<THREE.Object3D | null>(null);

  // Load realistic ReadyPlayerMe human avatar
  const { scene } = useGLTF('/models/readyplayer.me.glb');
  
  // Locate bones and configure shadows for realistic human avatar
  useEffect(() => {
    if (scene) {
      scene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
        if (child.name === 'Spine1' || child.name === 'Spine2') {
          spineNode.current = child;
        }
        if (child.name === 'Head') {
          headNode.current = child;
        }
      });
    }
  }, [scene]);

  // Subtle lifelike breathing & micro-sway animation
  useFrame(({ clock }) => {
    const elapsed = clock.getElapsedTime();

    // Natural human chest breathing
    if (spineNode.current) {
      spineNode.current.rotation.x = Math.sin(elapsed * 1.6) * 0.02;
    }
    // Subtle head alertness motion
    if (headNode.current) {
      headNode.current.rotation.y = Math.sin(elapsed * 0.8) * 0.04;
    }

    // Floating Context Invariant Halo
    if (haloRef.current) {
      haloRef.current.rotation.y = elapsed * 1.5;
      haloRef.current.rotation.x = Math.PI / 2;
      haloRef.current.scale.setScalar(1 + Math.sin(elapsed * 2.5) * 0.05);
    }
  });

  const showHalo = invariantStatus === 'active' || invariantStatus === 'restored' || invariantStatus === 'compressed';

  return (
    <group position={position} onClick={(e) => { e.stopPropagation(); onClick?.(); }}>
      {/* ── Realistic Human 3D Model ── */}
      <primitive 
        object={scene} 
        scale={1.8} 
        position={[0, 0, 0]} 
        rotation={[0, -0.3, 0]} 
      />

      {/* ── Contextual Invariant Marker (Subtle floating ring over head) ── */}
      {/* Visual representation of the AI Game Master's active context constraint */}
      {showHalo && (
        <mesh ref={haloRef} position={[0, 3.55, 0]}>
          <torusGeometry args={[0.35, 0.03, 16, 32]} />
          <meshBasicMaterial color="#cc785c" transparent opacity={0.85} />
        </mesh>
      )}

      {/* ── Non-Obstructing Info Card (Offset to the side so human is NEVER hidden) ── */}
      {showCard && (
        <Html position={[1.2, 2.4, 0]} zIndexRange={[100, 0]} distanceFactor={14}>
          <div className="relative pointer-events-auto select-none">
            {/* Subtle connector indicator from player to badge */}
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-[1px] bg-[#cc785c]/60" />
              <div className="bg-[#faf9f5]/95 backdrop-blur-md border border-[#e6dfd8] border-l-2 border-l-[#cc785c] px-2.5 py-1.5 rounded-sm shadow-md min-w-[130px]">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[9px] font-mono font-semibold text-[#141413] tracking-wide">
                    {playerName ? `${playerName} (PLAYER 7)` : 'PLAYER 7'}
                  </span>
                  {isCurrent ? (
                    <span className="text-[7px] font-mono px-1 py-0.2 rounded bg-[#cc785c]/30 text-[#cc785c] font-bold">
                      YOU
                    </span>
                  ) : (
                    <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-[#cc785c]/15 text-[#cc785c] font-medium">
                      TRUSTED
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between text-[9px]">
                  <span className="text-[#6c6a64]">Invariant:</span>
                  <span className={`font-mono font-medium ${showHalo ? 'text-[#cc785c]' : 'text-[#8c8a82] line-through'}`}>
                    {invariantStatus.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

// Preload the realistic human avatar
useGLTF.preload('/models/readyplayer.me.glb');
