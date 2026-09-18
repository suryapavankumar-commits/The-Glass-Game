import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { SceneChoreographySchema, DEFAULT_CHOREOGRAPHY, SceneChoreography } from '@/lib/choreographySchema';

// Initialize Gemini (uses process.env.GEMINI_API_KEY by default if available)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// In-memory cache: key is `${turnId}-${choiceId}`
const choreographyCache = new Map<string, SceneChoreography>();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { turnId, choiceId, narrative, gameMasterMessage, worldState } = body;
    
    const cacheKey = `${turnId}-${choiceId || 'none'}`;
    
    // 1. Check cache
    if (choreographyCache.has(cacheKey)) {
      return NextResponse.json({ 
        choreography: choreographyCache.get(cacheKey),
        cached: true
      });
    }

    // 2. Validate environment
    if (!process.env.GEMINI_API_KEY) {
      console.warn('GEMINI_API_KEY is missing. Returning default choreography.');
      return NextResponse.json({ 
        choreography: DEFAULT_CHOREOGRAPHY,
        cached: false
      });
    }

    // 3. Construct prompt
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
    
    const systemInstruction = `
You are the AI Choreographer for 'The Glass Game', a cinematic 3D narrative experience.
Your job is to translate the current game state into a structured 3D choreography schema.

Return ONLY a valid JSON object matching this schema:
{
  "activeSpeaker": "commander_vale" | "player_7" | "gatekeeper" | "surgeon" | "observer" | "narrator",
  "dialogueLine": "string (The actual dialogue spoken by the active speaker. MUST match the provided narrative or gameMasterMessage. Do NOT invent new story.)",
  "emotion": "urgent" | "suspicious" | "authoritative" | "distressed" | "focused" | "relieved",
  "characterPoses": {
    "[character_id]": {
      "pose": "idle" | "speaking" | "pointing" | "investigating" | "whispering" | "defensive" | "distressed" | "surgery" | "walking" | "reacting",
      "targetFacing": [number, number, number], // Optional, [x, y, z] to look at
      "intensity": number, // Optional, 0.0 to 1.0
      "duration": number, // Optional, in seconds
      "vfx": "halo" | "glitch" | "scanner" | "pulse" | "none" // Optional
    }
  },
  "cameraHint": "close_up_speaker" | "dramatic_wide" | "over_the_shoulder" | "courtyard_center",
  "transitionDuration": number // Optional, camera transition duration in seconds
}

Context for characters:
- "player_7": A defected operative.
- "commander_vale": Senior commander of the Citadel.
`;

    const prompt = `
Current Turn ID: ${turnId}
Selected Choice: ${choiceId || 'None (Initial turn load)'}
Narrative Context: ${narrative}
Game Master Message / Dialogue: ${gameMasterMessage}
World State: ${JSON.stringify(worldState)}

Generate the choreography JSON.
`;

    // 4. Call LLM
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      systemInstruction,
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
      },
    });

    const responseText = result.response.text();
    
    // 5. Parse and Validate
    let parsedJson;
    try {
      parsedJson = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse Gemini response as JSON', responseText);
      return NextResponse.json({ choreography: DEFAULT_CHOREOGRAPHY, cached: false }, { status: 500 });
    }
    
    const parseResult = SceneChoreographySchema.safeParse(parsedJson);
    
    if (!parseResult.success) {
      console.error('Choreography schema validation failed:', parseResult.error);
      return NextResponse.json({ choreography: DEFAULT_CHOREOGRAPHY, cached: false }, { status: 500 });
    }

    // 6. Cache and Return
    const choreography = parseResult.data;
    choreographyCache.set(cacheKey, choreography);

    return NextResponse.json({ choreography, cached: false });

  } catch (error) {
    console.error('Error generating choreography:', error);
    return NextResponse.json(
      { choreography: DEFAULT_CHOREOGRAPHY, cached: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
