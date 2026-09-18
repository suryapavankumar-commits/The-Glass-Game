'use client';

import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { SceneChoreography } from '@/lib/choreographySchema';

interface ChoreographyControllerProps {
  choreography: SceneChoreography;
  isFailed: boolean;
}

export function ChoreographyController({ choreography, isFailed }: ChoreographyControllerProps) {
  const { camera } = useThree();
  const targetPosition = useRef(new THREE.Vector3(0, 6.5, 20));
  const targetLookAt = useRef(new THREE.Vector3(0, 4.5, -5));
  const currentLookAt = useRef(new THREE.Vector3(0, 4.5, -5));

  useEffect(() => {
    if (isFailed) {
      // Failure framing
      targetPosition.current.set(0, 6.5, 20);
      targetLookAt.current.set(0, 4.5, -5);
      return;
    }

    const { cameraHint } = choreography;

    switch (cameraHint) {
      case 'close_up_speaker':
        // Focus roughly on Player 7's area
        targetPosition.current.set(4.6, 2.8, 9.0);
        targetLookAt.current.set(3.2, 1.8, 5.0);
        break;
      case 'dramatic_wide':
        // Grand overview of the hall
        targetPosition.current.set(0, 7.5, 22);
        targetLookAt.current.set(0, 5.0, -6);
        break;
      case 'over_the_shoulder':
        // Over the shoulder view
        targetPosition.current.set(5.2, 3.2, 10.0);
        targetLookAt.current.set(3.2, 1.8, 5.0);
        break;
      case 'courtyard_center':
      default:
        // Default view showing the courtyard and fountain
        targetPosition.current.set(0, 6.5, 20);
        targetLookAt.current.set(0, 4.5, -5);
        break;
    }
  }, [choreography, isFailed]);

  useFrame((state, delta) => {
    if (isFailed) return;
    
    // Use transitionDuration from choreography if available, otherwise default lerp factor
    const duration = choreography.transitionDuration || 1.5;
    const lerpFactor = Math.min(delta * (1 / duration) * 5, 1);
    
    camera.position.lerp(targetPosition.current, lerpFactor);
    currentLookAt.current.lerp(targetLookAt.current, lerpFactor);
    camera.lookAt(currentLookAt.current);
  });

  return null;
}
