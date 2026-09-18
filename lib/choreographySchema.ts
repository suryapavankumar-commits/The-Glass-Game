import { z } from 'zod';

export const CharacterPoseSchema = z.enum([
  'idle',
  'speaking',
  'pointing',
  'investigating',
  'whispering',
  'defensive',
  'distressed',
  'surgery',
  'walking',
  'reacting'
]);

export type CharacterPose = z.infer<typeof CharacterPoseSchema>;

export const SceneChoreographySchema = z.object({
  activeSpeaker: z.enum(['commander_vale', 'player_7', 'gatekeeper', 'surgeon', 'observer', 'narrator']),
  dialogueLine: z.string().describe('The canonical dialogue line spoken in this moment.'),
  emotion: z.enum(['urgent', 'suspicious', 'authoritative', 'distressed', 'focused', 'relieved']),
  characterPoses: z.record(z.string(), z.object({
    pose: CharacterPoseSchema,
    targetFacing: z.tuple([z.number(), z.number(), z.number()]).optional().describe('[x, y, z] to look at'),
    movementDelta: z.tuple([z.number(), z.number(), z.number()]).optional().describe('Relative translation [x, y, z]'),
    intensity: z.number().min(0).max(1).optional().describe('Animation intensity 0-1'),
    duration: z.number().min(0).max(10).optional().describe('Transition duration in seconds'),
    vfx: z.enum(['halo', 'glitch', 'scanner', 'pulse', 'none']).optional()
  })),
  cameraHint: z.enum(['close_up_speaker', 'dramatic_wide', 'over_the_shoulder', 'courtyard_center']).optional(),
  transitionDuration: z.number().min(0).max(10).optional().describe('Camera transition duration in seconds')
});

export type SceneChoreography = z.infer<typeof SceneChoreographySchema>;

// Default choreography for fallback when AI generation fails
export const DEFAULT_CHOREOGRAPHY: SceneChoreography = {
  activeSpeaker: 'narrator',
  dialogueLine: '...',
  emotion: 'focused',
  characterPoses: {
    player_7: { pose: 'idle' }
  },
  cameraHint: 'courtyard_center',
  transitionDuration: 1.5
};
