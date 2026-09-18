import { NextRequest, NextResponse } from 'next/server';
import { roomService } from '@/services/roomService';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const body = await req.json().catch(() => ({}));
    const { playerId, action } = body;

    if (!playerId) {
      return NextResponse.json(
        { success: false, error: 'PLAYER_ID_REQUIRED' },
        { status: 400 }
      );
    }

    const room = await roomService.submitAction(code, playerId, action || { actionType: 'advance_turn', timestamp: new Date().toISOString() });

    return NextResponse.json({
      success: true,
      room,
      gameState: room.gameState,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'ACTION_FAILED' },
      { status: 500 }
    );
  }
}
