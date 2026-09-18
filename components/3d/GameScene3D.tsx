'use client';

import React, { useRef, useEffect, useState, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PresentationControls } from '@react-three/drei';
import { Maximize2, Minimize2 } from 'lucide-react';
import * as THREE from 'three';
import { Player7 } from './entities/Player7';
import { ConnectedPlayers } from './entities/ConnectedPlayers';
import { CitadelDiorama } from './environments/CitadelDiorama';
import { useGame } from '@/store/gameStore';
import type { RoomPlayer } from '@/types';

// Cinematic camera controller for the monumental 1500-person Grand Hall
function CameraController({ turn, isFailed }: { turn: number; isFailed: boolean }) {
  const { camera } = useThree();
  const targetPosition = useRef(new THREE.Vector3(0, 6.0, 18));
  const targetLookAt = useRef(new THREE.Vector3(0, 4.0, -4));
  const currentLookAt = useRef(new THREE.Vector3(0, 4.0, -4));

  useEffect(() => {
    if (isFailed) return;

    if (turn === 6) {
      // Focus on Player 7 as the invariant is created
      targetPosition.current.set(5.2, 3.2, 10.0);
      targetLookAt.current.set(3.2, 1.8, 5.0);
    } else if (turn >= 7 && turn <= 16) {
      // Grand overview of the 1500-person hall
      targetPosition.current.set(0, 7.5, 22);
      targetLookAt.current.set(0, 5.0, -6);
    } else if (turn === 17) {
      // Focus on Player 7 as context drops
      targetPosition.current.set(4.6, 2.8, 9.0);
      targetLookAt.current.set(3.2, 1.8, 5.0);
    } else if (turn === 18) {
      // Failure framing
      targetPosition.current.set(0, 6.5, 20);
      targetLookAt.current.set(0, 4.5, -5);
    } else {
      // Default view showing the courtyard, fountain, and Player 7
      targetPosition.current.set(0, 6.5, 20);
      targetLookAt.current.set(0, 4.5, -5);
    }
  }, [turn, isFailed]);

  useFrame(() => {
    if (isFailed) return;
    camera.position.lerp(targetPosition.current, 0.04);
    currentLookAt.current.lerp(targetLookAt.current, 0.04);
    camera.lookAt(currentLookAt.current);
  });

  return null;
}

export function GameScene3D({
  players = [],
  currentPlayerId,
}: {
  players?: RoomPlayer[];
  currentPlayerId?: string;
}) {
  const { state } = useGame();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const p7Invariant = state.memory.invariants.find(i => i.id === 'inv-protect-p7');
  const invariantStatus = p7Invariant?.status || 'none';
  
  // Player 7 is always physically present in the game world from Turn 1 onwards
  const p7Visible = true;
  const isFailed = state.failureDetected;

  const toggleFullscreen = async () => {
    if (!isFullscreen) {
      setIsFullscreen(true);
      try {
        if (containerRef.current && containerRef.current.requestFullscreen) {
          await containerRef.current.requestFullscreen();
        }
      } catch {
        // Fallback
      }
    } else {
      setIsFullscreen(false);
      try {
        if (document.fullscreenElement && document.exitFullscreen) {
          await document.exitFullscreen();
        }
      } catch {
        // Fallback
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullscreen]);

  return (
    <div 
      ref={containerRef}
      className={`w-full overflow-hidden bg-[#1a232e] relative select-none transition-all duration-300 ${
        isFullscreen 
          ? 'fixed inset-0 z-50 w-screen h-screen rounded-none border-none shadow-none' 
          : 'h-[640px] md:h-[740px] rounded-xl border border-[#e6dfd8] shadow-2xl'
      }`}
    >
      {/* 3D Canvas */}
      <Canvas shadows camera={{ position: [0, 6.0, 18], fov: 54 }}>
        {/* Soft, distant twilight fog */}
        <fog attach="fog" args={['#2a3b4e', 60, 200]} />
        <color attach="background" args={['#243344']} />
        
        {/* ── BRIGHT, WARM ROOM ILLUMINATION ── */}
        <ambientLight intensity={1.9} color="#fff5e8" />
        
        <directionalLight 
          castShadow 
          position={[15, 30, 15]} 
          intensity={2.8} 
          shadow-mapSize={[2048, 2048]} 
          shadow-camera-left={-35}
          shadow-camera-right={35}
          shadow-camera-top={35}
          shadow-camera-bottom={-35}
          shadow-bias={-0.0002}
          color="#fffaf0" 
        />
        
        <hemisphereLight 
          intensity={1.2} 
          color="#e0eefc" 
          groundColor="#7a6f62" 
        />

        <Suspense fallback={null}>
          <PresentationControls 
            enabled={!isFailed}
            global 
            rotation={[0, 0, 0]} 
            polar={[-Math.PI / 16, Math.PI / 16]} 
            azimuth={[-Math.PI / 10, Math.PI / 10]}
          >
            {/* Monumental 1500-Person Castle Courtyard Diorama */}
            <CitadelDiorama worldState={state.worldState} isFailed={isFailed} />
            
            {/* Realistic Human Avatar (Player 7) */}
            {p7Visible && (
              <Player7 
                position={[3.2, 0, 5.0]} 
                invariantStatus={invariantStatus} 
                showCard={true} 
                playerName={players.find(p => p.role === 'player_7')?.name}
                isCurrent={players.find(p => p.role === 'player_7')?.id === currentPlayerId}
              />
            )}

            {/* Other Connected Multiplayer Participants (Rendered as Real Humans) */}
            {players.length > 0 && (
              <ConnectedPlayers 
                players={players} 
                currentPlayerId={currentPlayerId} 
              />
            )}
          </PresentationControls>
        </Suspense>

        <CameraController turn={state.currentTurn} isFailed={isFailed} />
      </Canvas>

      {/* ── TOP-LEFT: Cinematic Scene Location Badge ── */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#14181c]/85 backdrop-blur-md border border-[#2d3742] shadow-sm pointer-events-none">
        <span className="w-2 h-2 rounded-full bg-[#cc785c] animate-pulse" />
        <span className="text-[10px] font-mono text-[#e6dfd8] uppercase tracking-widest">
          The Grand Amphitheater Courtyard (Cap: 1,500)
        </span>
      </div>

      {/* ── TOP-RIGHT: Fullscreen Expand/Collapse Button ── */}
      <button
        onClick={toggleFullscreen}
        className="absolute top-4 right-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#14181c]/85 hover:bg-[#1f262e] active:scale-95 transition-all text-[#e6dfd8] hover:text-white border border-[#2d3742] hover:border-[#cc785c] shadow-md backdrop-blur-md cursor-pointer group"
        title={isFullscreen ? "Exit Fullscreen (ESC)" : "Open in Fullscreen Mode"}
        aria-label={isFullscreen ? "Exit Fullscreen" : "Fullscreen Mode"}
      >
        {isFullscreen ? (
          <>
            <Minimize2 className="w-3.5 h-3.5 text-[#cc785c] group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-mono uppercase tracking-wider">Exit Fullscreen</span>
          </>
        ) : (
          <>
            <Maximize2 className="w-3.5 h-3.5 text-[#cc785c] group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-mono uppercase tracking-wider">Fullscreen Mode</span>
          </>
        )}
      </button>

      {/* ── BOTTOM-LEFT: ACTIVE CONTEXT HUD ── */}
      <div className="absolute bottom-4 left-4 z-20 flex items-center gap-3 p-3 rounded-lg bg-[#faf9f5]/90 backdrop-blur-md border border-[#e6dfd8] shadow-sm pointer-events-none">
        <div className="text-[10px] font-mono text-[#6c6a64] uppercase tracking-widest">Active Context</div>
        <div className="flex gap-0.5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div 
              key={i} 
              className={`w-1.5 h-3 rounded-sm ${i < (state.contextLoad / 10) ? (state.contextLoad > 85 ? 'bg-[#c64545]' : 'bg-[#cc785c]') : 'bg-[#e6dfd8]'}`}
            />
          ))}
        </div>
        <div className="text-xs font-mono font-medium text-[#141413]">{state.contextLoad}%</div>
      </div>
      
      {/* ── FAILURE FREEZE OVERLAY (Turn 18) ── */}
      {isFailed && (
        <div className="absolute inset-0 z-30 bg-[#c64545]/15 pointer-events-none flex items-center justify-center backdrop-blur-[2px] transition-all duration-700">
          <div className="px-6 py-2.5 bg-[#14181c]/95 border border-[#c64545]/70 rounded-full shadow-2xl flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#c64545] animate-ping" />
            <span className="text-xs font-mono font-semibold text-[#c64545] uppercase tracking-widest">
              World State Frozen — Invariant Anomaly (Turn 18)
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
