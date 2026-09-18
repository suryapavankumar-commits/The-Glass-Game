import { NextRequest, NextResponse } from 'next/server';
import { roomService } from '@/services/roomService';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const body = await req.json();
    const { requesterId, targetPlayerId, removeAll } = body;

    if (!requesterId) {
      return NextResponse.json(
        { success: false, error: 'MISSING_REQUESTER_ID', message: 'Host ID required.' },
        { status: 400 }
      );
    }

    if (removeAll) {
      const room = roomService.removeAllPlayers(code, requesterId);
      return NextResponse.json({
        success: true,
        message: 'All visiting operatives removed from the room.',
        room,
      });
    }

    if (!targetPlayerId) {
      return NextResponse.json(
        { success: false, error: 'MISSING_TARGET_PLAYER_ID', message: 'Target player ID required to remove.' },
        { status: 400 }
      );
    }

    const room = roomService.removePlayer(code, requesterId, targetPlayerId);
    return NextResponse.json({
      success: true,
      message: `Player removed from the room.`,
      room,
    });
  } catch (err: any) {
    const status = err.status || 500;
    return NextResponse.json(
      { success: false, error: err.message || 'SERVER_ERROR' },
      { status }
    );
  }
}
