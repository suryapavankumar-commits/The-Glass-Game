import { NextRequest, NextResponse } from 'next/server';
import { roomService } from '@/services/roomService';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const body = await req.json().catch(() => ({}));
    const playerId = body.playerId;

    if (!playerId) {
      return NextResponse.json(
        { success: false, error: 'PLAYER_ID_REQUIRED' },
        { status: 400 }
      );
    }

    const room = roomService.startGame(code, playerId);

    return NextResponse.json({
      success: true,
      room,
    });
  } catch (err: any) {
    if (err.message === 'NOT_HOST') {
      return NextResponse.json(
        { success: false, error: 'NOT_HOST', message: 'Only the room host can start the game.' },
        { status: 403 }
      );
    }
    if (err.message === 'ROOM_NOT_FOUND') {
      return NextResponse.json(
        { success: false, error: 'ROOM_NOT_FOUND', message: 'Room not found.' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { success: false, error: err.message || 'FAILED_TO_START' },
      { status: 500 }
    );
  }
}
