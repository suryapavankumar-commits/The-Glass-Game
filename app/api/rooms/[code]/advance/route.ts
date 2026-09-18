import { NextResponse } from 'next/server';
import { roomService } from '@/services/roomService';
import { firebaseService } from '@/services/firebaseService';
import { generateGameMasterSituation } from '@/services/ai/gameMasterService';
import { checkSemanticRisk } from '@/services/ai/semanticRiskClassifier';
import { performContextSurgery } from '@/services/ai/contextSurgeonService';
import { generateCommanderDecision } from '@/services/ai/commanderValeService';

export async function POST(req: Request, context: { params: Promise<{ code: string }> }) {
  try {
    const params = await context.params;
    const { code } = params;
    const body = await req.json();
    const { requesterId } = body;

    const room = roomService.getRoom(code);
    if (!room) {
      return NextResponse.json({ success: false, error: 'Room not found' }, { status: 404 });
    }

    if (room.hostId !== requesterId) {
      return NextResponse.json({ success: false, error: 'Only the host can advance the game' }, { status: 403 });
    }

    // 1. Advance Turn & Phase
    room.gameState.currentTurn += 1;
    room.gameState.phase = 'generating_situation';
    
    // Fire-and-forget sync to Firebase so clients polling see the new phase immediately
    firebaseService.recordRoomCreated(room, room.players[0]).catch(console.warn);

    // Get Canonical Facts
    const canonicalFacts = await firebaseService.getCanonicalFacts(code);

    try {
      // 2. GAME MASTER
      const gmOutput = await generateGameMasterSituation(room.gameState);
      
      // Save claims to Narrative History
      for (let i = 0; i < gmOutput.claims.length; i++) {
        await firebaseService.recordNarrativeClaim(code, {
          id: `claim-${room.gameState.currentTurn}-${i}`,
          claim: gmOutput.claims[i],
          turn: room.gameState.currentTurn,
        });
      }

      // 3. SEMANTIC RISK CLASSIFIER
      const risk = await checkSemanticRisk(gmOutput.claims, canonicalFacts);

      let finalContext = gmOutput.situation;
      
      if (risk.isSuspicious) {
        // 4. CONTEXT SURGERY
        room.gameState.phase = 'context_surgery';
        firebaseService.recordRoomCreated(room, room.players[0]).catch(console.warn);

        const surgery = await performContextSurgery(gmOutput.situation, gmOutput.claims, canonicalFacts);
        
        if (!surgery.isValid && surgery.repairedContext) {
          finalContext = surgery.repairedContext;
          // Note: Here we could save the surgery report to Firebase for the visualizer
        }
      }

      // 5. COMMANDER VALE
      room.gameState.phase = 'commander_decision';
      firebaseService.recordRoomCreated(room, room.players[0]).catch(console.warn);

      const decision = await generateCommanderDecision(finalContext, room.players);
      room.gameState.latestDecision = decision;

      // 6. ASSIGN INDIVIDUAL OBJECTIVES
      room.gameState.phase = 'assigning_objectives';
      for (const player of room.players) {
        if (player.isHost) continue; // Commander doesn't get a private order from themselves
        
        const privateOrder = decision.playerOrders[player.id];
        if (privateOrder) {
          const objective = {
            id: `obj-${room.gameState.currentTurn}-${player.id}`,
            description: privateOrder,
            status: 'active' as const,
          };
          player.privateObjective = objective;
          await firebaseService.updatePlayerPrivateObjective(code, player.id, objective);
        }
      }

      // Update public state with global orders
      room.gameState.phase = 'player_action';
      room.traces.push({
        id: `step-advance-${Date.now()}`,
        type: 'user_input',
        turn: room.gameState.currentTurn,
        timestamp: new Date().toISOString(),
        status: 'success',
        title: `Turn ${room.gameState.currentTurn} AI Generation Complete`,
        description: decision.globalOrders,
        durationMs: 0,
      });

      // Save global fact? 
      // For now, let's just make sure the state is synced.
      await firebaseService.recordRoomCreated(room, room.players[0]);

      return NextResponse.json({ success: true, room });

    } catch (aiError) {
      console.error('[AI Pipeline Failed] Falling back to gameScript.ts', aiError);
      
      // DETERMINISTIC FALLBACK (gameScript.ts)
      roomService.submitAction(code, requesterId, {
        actionType: 'advance_turn',
        timestamp: new Date().toISOString()
      });
      room.gameState.phase = 'player_action';
      await firebaseService.recordRoomCreated(room, room.players[0]);
      
      return NextResponse.json({ success: true, room, fallbackUsed: true });
    }

  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
