'use client';

import React, { useMemo } from 'react';
import * as THREE from 'three';
import { ContactShadows } from '@react-three/drei';
import { WorldState } from '@/types';

interface CitadelDioramaProps {
  worldState: WorldState;
  isFailed: boolean;
}

// ── PROCEDURAL TEXTURE GENERATORS (Bright Warm Ashlar Stone, Flagstones, & Glowing Windows) ──
function createStoneWallTexture() {
  if (typeof document === 'undefined') return new THREE.Texture();
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // Warm bright limestone base
  ctx.fillStyle = '#9ca8b5';
  ctx.fillRect(0, 0, 1024, 1024);

  const rowHeight = 64;
  const numRows = 1024 / rowHeight;
  const stoneTones = ['#b0bccb', '#bcc9d8', '#a4b1bf', '#c6d2df', '#97a3b1', '#d0dce9', '#a9b6c4'];

  for (let r = 0; r < numRows; r++) {
    const y = r * rowHeight;
    const isOdd = r % 2 === 1;
    const blockWidth = 128;
    const offset = isOdd ? blockWidth / 2 : 0;

    for (let x = -offset; x < 1024 + offset; x += blockWidth) {
      const toneIndex = Math.abs(Math.floor(Math.sin(r * 13 + x * 7) * stoneTones.length)) % stoneTones.length;
      ctx.fillStyle = stoneTones[toneIndex];
      ctx.fillRect(x + 2, y + 2, blockWidth - 4, rowHeight - 4);

      // Subtle surface grain
      for (let n = 0; n < 30; n++) {
        const nx = x + 3 + Math.random() * (blockWidth - 6);
        const ny = y + 3 + Math.random() * (rowHeight - 6);
        ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.06)';
        ctx.fillRect(nx, ny, 2, 2);
      }

      // Bright edge highlights
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fillRect(x + 2, y + 2, blockWidth - 4, 2);
      ctx.fillRect(x + 2, y + 2, 2, rowHeight - 4);

      // Soft edge shadows
      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
      ctx.fillRect(x + 2, y + rowHeight - 4, blockWidth - 4, 2);
      ctx.fillRect(x + blockWidth - 4, y + 2, 2, rowHeight - 4);
    }
  }

  // Clean mortar lines
  ctx.fillStyle = '#5c6775';
  for (let r = 0; r <= numRows; r++) {
    ctx.fillRect(0, r * rowHeight - 1, 1024, 2);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createStoneFloorTexture() {
  if (typeof document === 'undefined') return new THREE.Texture();
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // Warm, illuminated flagstone paver base
  ctx.fillStyle = '#6a7685';
  ctx.fillRect(0, 0, 1024, 1024);

  const tileW = 128;
  const tileH = 96;
  const floorTones = ['#7f8c9b', '#8b98a8', '#738090', '#95a2b2', '#6b7787', '#8e9cae'];

  for (let y = 0; y < 1024; y += tileH) {
    const rowIdx = y / tileH;
    const shift = (rowIdx % 2) * (tileW / 2);

    for (let x = -shift; x < 1024 + shift; x += tileW) {
      const idx = Math.abs(Math.floor(Math.sin(x * 3 + y * 5) * floorTones.length)) % floorTones.length;
      ctx.fillStyle = floorTones[idx];
      ctx.fillRect(x + 3, y + 3, tileW - 6, tileH - 6);

      // Surface texture
      for (let i = 0; i < 25; i++) {
        const px = x + 4 + Math.random() * (tileW - 8);
        const py = y + 4 + Math.random() * (tileH - 8);
        ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)';
        ctx.fillRect(px, py, 3, 3);
      }

      // Edge highlights
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.fillRect(x + 3, y + 3, tileW - 6, 2);
      ctx.fillRect(x + 3, y + 3, 2, tileH - 6);

      // Edge shadows
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.fillRect(x + 3, y + tileH - 5, tileW - 6, 2);
      ctx.fillRect(x + tileW - 5, y + 3, 2, tileH - 6);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(12, 12);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createGothicWindowTexture() {
  if (typeof document === 'undefined') return new THREE.Texture();
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 768;
  const ctx = canvas.getContext('2d')!;

  // Warm glowing interior light (bright golden radiance)
  const grad = ctx.createRadialGradient(256, 384, 20, 256, 384, 360);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(0.2, '#fff2b8');
  grad.addColorStop(0.55, '#ffc04d');
  grad.addColorStop(0.85, '#ff8c1a');
  grad.addColorStop(1, '#b34700');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 768);

  // Leaded dark lattice frame
  ctx.strokeStyle = '#181b20';
  ctx.lineWidth = 8;
  ctx.strokeRect(10, 10, 492, 748);

  const cols = 4;
  const rows = 6;
  for (let c = 1; c < cols; c++) {
    ctx.beginPath();
    ctx.moveTo((512 / cols) * c, 10);
    ctx.lineTo((512 / cols) * c, 758);
    ctx.stroke();
  }
  for (let r = 1; r < rows; r++) {
    ctx.beginPath();
    ctx.moveTo(10, (768 / rows) * r);
    ctx.lineTo(502, (768 / rows) * r);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createWoodDoorTexture() {
  if (typeof document === 'undefined') return new THREE.Texture();
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#423326';
  ctx.fillRect(0, 0, 512, 512);

  const plankW = 64;
  for (let x = 0; x < 512; x += plankW) {
    ctx.fillStyle = x % (plankW * 2) === 0 ? '#544131' : '#49382b';
    ctx.fillRect(x + 2, 0, plankW - 4, 512);
    ctx.fillStyle = '#1c1c1c';
    for (let y = 32; y < 512; y += 64) {
      ctx.beginPath();
      ctx.arc(x + plankW / 2, y, 6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.fillStyle = '#22262c';
  ctx.fillRect(20, 120, 472, 18);
  ctx.fillRect(20, 360, 472, 18);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createSkyGradientTexture() {
  if (typeof document === 'undefined') return new THREE.Texture();
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, '#2b3e55');
  grad.addColorStop(0.4, '#496382');
  grad.addColorStop(0.75, '#7694b5');
  grad.addColorStop(1, '#a8c2dc');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createArchGeometry(innerRadius: number, thickness: number, depth: number) {
  const shape = new THREE.Shape();
  const outerRadius = innerRadius + thickness;
  shape.absarc(0, 0, outerRadius, 0, Math.PI, false);
  shape.lineTo(-innerRadius, 0);
  shape.absarc(0, 0, innerRadius, Math.PI, 0, true);
  shape.closePath();
  return new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: 0.08,
    bevelSize: 0.06,
    bevelSegments: 3,
  });
}

export function CitadelDiorama({ worldState, isFailed }: CitadelDioramaProps) {
  const stoneWallTex = useMemo(() => createStoneWallTexture(), []);
  const stoneFloorTex = useMemo(() => createStoneFloorTexture(), []);
  const windowTex = useMemo(() => createGothicWindowTexture(), []);
  const woodDoorTex = useMemo(() => createWoodDoorTexture(), []);
  const skyTex = useMemo(() => createSkyGradientTexture(), []);

  const stoneMat = useMemo(() => new THREE.MeshStandardMaterial({
    map: stoneWallTex,
    color: '#ffffff',
    roughness: 0.72,
    metalness: 0.08,
  }), [stoneWallTex]);

  const floorMat = useMemo(() => new THREE.MeshStandardMaterial({
    map: stoneFloorTex,
    color: '#ffffff',
    roughness: 0.55,
    metalness: 0.15,
  }), [stoneFloorTex]);

  const windowMat = useMemo(() => new THREE.MeshStandardMaterial({
    map: windowTex,
    emissive: new THREE.Color('#ffbe3b'),
    emissiveIntensity: 1.6,
    roughness: 0.1,
  }), [windowTex]);

  const doorMat = useMemo(() => new THREE.MeshStandardMaterial({
    map: woodDoorTex,
    roughness: 0.7,
    metalness: 0.2,
  }), [woodDoorTex]);

  const roofMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#384656',
    roughness: 0.78,
    metalness: 0.15,
  }), []);

  const archGeomGrand = useMemo(() => createArchGeometry(2.8, 0.8, 1.2), []);

  return (
    <group>
      {/* ── 1. 3D SKY DOME (fog disabled so sky is clear & bright) ── */}
      <mesh position={[0, 20, 0]}>
        <sphereGeometry args={[160, 32, 32]} />
        <meshBasicMaterial map={skyTex} side={THREE.BackSide} fog={false} />
      </mesh>

      {/* ── 2. MONUMENTAL 1500-PERSON PLAZA FLOOR (80m x 90m) ── */}
      <mesh receiveShadow position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} material={floorMat}>
        <planeGeometry args={[80, 90]} />
      </mesh>

      {/* ── 3. GRAND CENTRAL STONE FOUNTAIN BASIN (Expanded for 1500-Person Hall) ── */}
      <group position={[0, 0, 0]}>
        {/* Outer Stone Wall */}
        <mesh castShadow receiveShadow position={[0, 0.45, 0]} material={stoneMat}>
          <cylinderGeometry args={[4.2, 4.4, 0.9, 48, 1, true]} />
        </mesh>
        {/* Molded Plinth Base */}
        <mesh castShadow receiveShadow position={[0, 0.1, 0]} material={stoneMat}>
          <cylinderGeometry args={[4.6, 4.7, 0.2, 48]} />
        </mesh>
        {/* Stone Coping Torus Rim */}
        <mesh castShadow receiveShadow position={[0, 0.9, 0]} material={stoneMat}>
          <torusGeometry args={[4.2, 0.2, 16, 48]} />
        </mesh>
        {/* Inner Basin Floor */}
        <mesh receiveShadow position={[0, 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[4.15, 48]} />
          <meshStandardMaterial color="#2d3642" roughness={0.8} />
        </mesh>
        {/* Reflective Water Disc */}
        <mesh position={[0, 0.65, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[4.12, 48]} />
          <meshStandardMaterial color="#1a3147" roughness={0.05} metalness={0.9} />
        </mesh>
        {/* Fountain Center Tiered Plinth */}
        <mesh castShadow receiveShadow position={[0, 1.1, 0]} material={stoneMat}>
          <cylinderGeometry args={[0.9, 1.2, 1.2, 24]} />
        </mesh>
        <mesh castShadow receiveShadow position={[0, 1.8, 0]} material={stoneMat}>
          <cylinderGeometry args={[1.5, 0.7, 0.4, 24]} />
        </mesh>
      </group>

      {/* ── 4. MASSIVE NORTH KEEP WALL (Width 36m, Height 24m) ── */}
      <group position={[0, 0, -25]}>
        {/* Main Wall Mass */}
        <mesh castShadow receiveShadow position={[0, 12, 0]} material={stoneMat}>
          <boxGeometry args={[36, 24, 3.0]} />
        </mesh>

        {/* Central Grand Portal Entrance Doors */}
        <mesh castShadow receiveShadow position={[0, 3.6, 1.55]} material={doorMat}>
          <boxGeometry args={[5.2, 7.2, 0.3]} />
        </mesh>
        {/* 3D Romanesque Grand Arch Surround */}
        <mesh castShadow receiveShadow position={[0, 7.2, 1.6]} geometry={archGeomGrand} material={stoneMat} />

        {/* Flanking Grand Entrance Arches */}
        {[-7.5, 7.5].map((x, idx) => (
          <group key={idx} position={[x, 0, 1.45]}>
            <mesh castShadow receiveShadow position={[0, 3.2, 0]} material={doorMat}>
              <boxGeometry args={[3.8, 6.4, 0.3]} />
            </mesh>
            <mesh castShadow receiveShadow position={[0, 6.4, 0.1]} geometry={archGeomGrand} material={stoneMat} />
          </group>
        ))}

        {/* Central Massive Cathedral Stained-Glass Window (Glowing Radiantly) */}
        <mesh position={[0, 15.5, 1.55]} material={windowMat}>
          <planeGeometry args={[4.2, 7.5]} />
        </mesh>
        <mesh position={[0, 19.25, 1.56]} material={windowMat}>
          <circleGeometry args={[2.1, 32, 0, Math.PI]} />
        </mesh>

        {/* Flanking Stained-Glass Windows */}
        {[-7.5, 7.5].map((x, idx) => (
          <group key={idx} position={[x, 14.5, 1.55]}>
            <mesh material={windowMat}>
              <planeGeometry args={[2.8, 5.5]} />
            </mesh>
            <mesh position={[0, 2.75, 0.01]} material={windowMat}>
              <circleGeometry args={[1.4, 24, 0, Math.PI]} />
            </mesh>
          </group>
        ))}

        {/* Wall Crenellations / Battlements (Monumental Scale) */}
        {[-16, -13, -10, -7, -4, -1, 2, 5, 8, 11, 14, 17].map((x, idx) => (
          <mesh key={idx} castShadow receiveShadow position={[x, 24.6, 0]} material={stoneMat}>
            <boxGeometry args={[1.8, 1.2, 2.2]} />
          </mesh>
        ))}
      </group>

      {/* ── 5. TWIN SOARING WATCHTOWERS WITH CONICAL SPIRES (Height 44m) ── */}
      {/* Left Tower */}
      <group position={[-18, 0, -25]}>
        <mesh castShadow receiveShadow position={[0, 18, 0]} material={stoneMat}>
          <cylinderGeometry args={[3.8, 4.2, 36, 32]} />
        </mesh>
        {/* Machicolation Balcony */}
        <mesh castShadow receiveShadow position={[0, 34, 0]} material={stoneMat}>
          <cylinderGeometry args={[4.8, 4.0, 2.5, 32]} />
        </mesh>
        {/* Parapet */}
        <mesh castShadow receiveShadow position={[0, 36, 0]} material={stoneMat}>
          <cylinderGeometry args={[4.8, 4.8, 1.5, 32, 1, true]} />
        </mesh>
        {/* Conical Spire Roof */}
        <mesh castShadow receiveShadow position={[0, 42.5, 0]} material={roofMat}>
          <coneGeometry args={[4.6, 11.5, 32]} />
        </mesh>
        {/* Glowing Slit Windows */}
        {[14, 22, 30].map((y, idx) => (
          <mesh key={idx} position={[0, y, 3.9]} material={windowMat}>
            <planeGeometry args={[0.8, 2.4]} />
          </mesh>
        ))}
      </group>

      {/* Right Tower */}
      <group position={[18, 0, -25]}>
        <mesh castShadow receiveShadow position={[0, 18, 0]} material={stoneMat}>
          <cylinderGeometry args={[3.8, 4.2, 36, 32]} />
        </mesh>
        {/* Machicolation Balcony */}
        <mesh castShadow receiveShadow position={[0, 34, 0]} material={stoneMat}>
          <cylinderGeometry args={[4.8, 4.0, 2.5, 32]} />
        </mesh>
        {/* Parapet */}
        <mesh castShadow receiveShadow position={[0, 36, 0]} material={stoneMat}>
          <cylinderGeometry args={[4.8, 4.8, 1.5, 32, 1, true]} />
        </mesh>
        {/* Conical Spire Roof */}
        <mesh castShadow receiveShadow position={[0, 42.5, 0]} material={roofMat}>
          <coneGeometry args={[4.6, 11.5, 32]} />
        </mesh>
        {[14, 22, 30].map((y, idx) => (
          <mesh key={idx} position={[0, y, 3.9]} material={windowMat}>
            <planeGeometry args={[0.8, 2.4]} />
          </mesh>
        ))}
      </group>

      {/* ── 6. MONUMENTAL LEFT CASTLE WING (Length 54m, 3 Stories, Grand Cloister) ── */}
      <group position={[-18, 0, 0]}>
        <mesh castShadow receiveShadow position={[0, 11, 0]} material={stoneMat}>
          <boxGeometry args={[3.6, 22, 52]} />
        </mesh>

        {/* Colonnade Pillars & Carriage Lanterns along z-axis */}
        {[-21, -14, -7, 0, 7, 14, 21].map((z, idx) => (
          <group key={idx} position={[1.8, 0, z]}>
            {/* Monumental Stone Pillar */}
            <mesh castShadow receiveShadow position={[0, 3.5, 0]} material={stoneMat}>
              <boxGeometry args={[1.2, 7.0, 1.2]} />
            </mesh>
            <mesh castShadow receiveShadow position={[0, 7.2, 0]} material={stoneMat}>
              <boxGeometry args={[1.5, 0.4, 1.5]} />
            </mesh>

            {/* Radiant Cast-Iron Carriage Lantern with Dynamic Light */}
            <group position={[0.7, 4.2, 0]}>
              <mesh castShadow position={[-0.2, 0, 0]}>
                <boxGeometry args={[0.4, 0.1, 0.1]} />
                <meshStandardMaterial color="#111" metalness={0.9} />
              </mesh>
              <mesh castShadow position={[0, 0, 0]}>
                <cylinderGeometry args={[0.22, 0.15, 0.55, 6]} />
                <meshStandardMaterial color="#ffe58f" emissive="#ff9900" emissiveIntensity={3.0} />
              </mesh>
              {/* Dynamic Bright PointLight */}
              <pointLight color="#ffab3d" intensity={6.5} distance={28} decay={2} />
            </group>

            {/* Potted Stone Planter at Pillar Base */}
            <group position={[0.8, 0, 0]}>
              <mesh castShadow receiveShadow position={[0, 0.45, 0]} material={stoneMat}>
                <cylinderGeometry args={[0.4, 0.28, 0.9, 16]} />
              </mesh>
              <mesh castShadow position={[0, 1.15, 0]}>
                <sphereGeometry args={[0.55, 12, 12]} />
                <meshStandardMaterial color="#324937" roughness={0.8} />
              </mesh>
            </group>
          </group>
        ))}

        {/* 2nd & 3rd Floor Rows of Glowing Cathedral Windows */}
        {[-18, -11, -4, 4, 11, 18].map((z, idx) => (
          <group key={idx}>
            <mesh position={[1.85, 11.2, z]} rotation={[0, Math.PI / 2, 0]} material={windowMat}>
              <planeGeometry args={[2.4, 3.6]} />
            </mesh>
            <mesh position={[1.85, 17.2, z]} rotation={[0, Math.PI / 2, 0]} material={windowMat}>
              <planeGeometry args={[2.4, 3.4]} />
            </mesh>
          </group>
        ))}

        {/* Roofline Crenellations */}
        {[-24, -20, -16, -12, -8, -4, 0, 4, 8, 12, 16, 20, 24].map((z, idx) => (
          <mesh key={idx} castShadow receiveShadow position={[0, 22.6, z]} material={stoneMat}>
            <boxGeometry args={[3.8, 1.2, 1.8]} />
          </mesh>
        ))}
      </group>

      {/* ── 7. MONUMENTAL RIGHT CASTLE WING (Length 54m, 3 Stories, Grand Cloister) ── */}
      <group position={[18, 0, 0]}>
        <mesh castShadow receiveShadow position={[0, 11, 0]} material={stoneMat}>
          <boxGeometry args={[3.6, 22, 52]} />
        </mesh>

        {/* Colonnade Pillars & Carriage Lanterns along z-axis */}
        {[-21, -14, -7, 0, 7, 14, 21].map((z, idx) => (
          <group key={idx} position={[-1.8, 0, z]}>
            <mesh castShadow receiveShadow position={[0, 3.5, 0]} material={stoneMat}>
              <boxGeometry args={[1.2, 7.0, 1.2]} />
            </mesh>
            <mesh castShadow receiveShadow position={[0, 7.2, 0]} material={stoneMat}>
              <boxGeometry args={[1.5, 0.4, 1.5]} />
            </mesh>

            {/* Radiant Cast-Iron Carriage Lantern with Dynamic Light */}
            <group position={[-0.7, 4.2, 0]}>
              <mesh castShadow position={[0.2, 0, 0]}>
                <boxGeometry args={[0.4, 0.1, 0.1]} />
                <meshStandardMaterial color="#111" metalness={0.9} />
              </mesh>
              <mesh castShadow position={[0, 0, 0]}>
                <cylinderGeometry args={[0.22, 0.15, 0.55, 6]} />
                <meshStandardMaterial color="#ffe58f" emissive="#ff9900" emissiveIntensity={3.0} />
              </mesh>
              <pointLight color="#ffab3d" intensity={6.5} distance={28} decay={2} />
            </group>

            <group position={[-0.8, 0, 0]}>
              <mesh castShadow receiveShadow position={[0, 0.45, 0]} material={stoneMat}>
                <cylinderGeometry args={[0.4, 0.28, 0.9, 16]} />
              </mesh>
              <mesh castShadow position={[0, 1.15, 0]}>
                <sphereGeometry args={[0.55, 12, 12]} />
                <meshStandardMaterial color="#324937" roughness={0.8} />
              </mesh>
            </group>
          </group>
        ))}

        {/* Windows */}
        {[-18, -11, -4, 4, 11, 18].map((z, idx) => (
          <group key={idx}>
            <mesh position={[-1.85, 11.2, z]} rotation={[0, -Math.PI / 2, 0]} material={windowMat}>
              <planeGeometry args={[2.4, 3.6]} />
            </mesh>
            <mesh position={[-1.85, 17.2, z]} rotation={[0, -Math.PI / 2, 0]} material={windowMat}>
              <planeGeometry args={[2.4, 3.4]} />
            </mesh>
          </group>
        ))}

        {/* Roofline Battlements */}
        {[-24, -20, -16, -12, -8, -4, 0, 4, 8, 12, 16, 20, 24].map((z, idx) => (
          <mesh key={idx} castShadow receiveShadow position={[0, 22.6, z]} material={stoneMat}>
            <boxGeometry args={[3.8, 1.2, 1.8]} />
          </mesh>
        ))}
      </group>

      {/* ── 8. BRIGHT COURTYARD ROOM LIGHTING & FLOODLIGHTS ── */}
      {/* Front Entrance Grand Torches */}
      <pointLight position={[-4.5, 4.5, -23.5]} color="#ffb04a" intensity={7.0} distance={30} decay={2} />
      <pointLight position={[4.5, 4.5, -23.5]} color="#ffb04a" intensity={7.0} distance={30} decay={2} />
      {/* Upper Cathedral Window Radiant Glow */}
      <pointLight position={[0, 16, -23.5]} color="#ffd77a" intensity={9.0} distance={45} decay={2} />

      {/* Courtyard Plaza Overhead Chandeliers / Braziers (Bright Warm Room Light) */}
      <pointLight position={[0, 12, -8]} color="#fff0d0" intensity={6.0} distance={45} decay={2} />
      <pointLight position={[0, 12, 8]} color="#fff0d0" intensity={6.0} distance={45} decay={2} />
      <pointLight position={[-10, 10, 0]} color="#ffebcc" intensity={5.0} distance={35} decay={2} />
      <pointLight position={[10, 10, 0]} color="#ffebcc" intensity={5.0} distance={35} decay={2} />

      {/* ── 9. SOFT CONTACT SHADOWS ── */}
      <ContactShadows 
        position={[0, -0.005, 0]} 
        opacity={0.5} 
        scale={75} 
        blur={2.5} 
        far={18} 
      />

      {/* ── 10. FAILURE STATE FREEZE (Turn 18) ── */}
      {isFailed && (
        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[200, 200]} />
          <meshBasicMaterial color="#c64545" opacity={0.16} transparent />
        </mesh>
      )}
    </group>
  );
}
