import { useState, useEffect } from 'react';
import type { SceneChoreography } from '@/lib/choreographySchema';
import { DEFAULT_CHOREOGRAPHY } from '@/lib/choreographySchema';
import type { GameState, Turn } from '@/types';
import { playTTS } from '@/lib/tts';

export function useChoreography(turnData: Turn | undefined, gameState: GameState) {
  const [choreography, setChoreography] = useState<SceneChoreography>(DEFAULT_CHOREOGRAPHY);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!turnData) return;

    let isMounted = true;
    
    const fetchChoreography = async () => {
      setIsLoading(true);
      
      try {
        const response = await fetch('/api/choreography', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            turnId: turnData.id,
            choiceId: turnData.selectedChoiceId,
            narrative: turnData.narrative,
            gameMasterMessage: turnData.gameMasterMessage,
            worldState: gameState.worldState
          })
        });

        if (response.ok) {
          const data = await response.json();
          if (isMounted && data.choreography) {
            setChoreography(data.choreography);
            
            // Auto-play TTS on choreography update
            if (data.choreography.dialogueLine) {
              playTTS(data.choreography.dialogueLine, data.choreography.activeSpeaker);
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch choreography:', error);
        // Fallback to default
        if (isMounted) setChoreography(DEFAULT_CHOREOGRAPHY);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchChoreography();

    return () => {
      isMounted = false;
    };
  }, [turnData, gameState.worldState]);

  return { choreography, isLoading };
}
