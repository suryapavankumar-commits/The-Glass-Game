import { NextRequest, NextResponse } from 'next/server';
import { roomService } from '@/services/roomService';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const body = await req.json().catch(() => ({}));
    const playerName = body.name || body.playerName || '';

    if (!playerName.trim()) {
      return NextResponse.json(
        { success: false, error: 'NAME_REQUIRED', message: 'Please provide a player name.' },
        { status: 400 }
      );
    }

    const { room, player } = roomService.joinRoom(code, playerName);

    return NextResponse.json({
      success: true,
      room,
      player,
    });
  } catch (err: any) {
    if (err.message === 'ROOM_FULL') {
      return NextResponse.json(
        {
          success: false,
          error: 'ROOM_FULL',
          message: 'ROOM FULL — 10 / 10 PLAYERS',
        },
        { status: 400 }
      );
    }

    if (err.message === 'ROOM_NOT_FOUND') {
      return NextResponse.json(
        {
          success: false,
          error: 'ROOM_NOT_FOUND',
          message: 'ROOM NOT FOUND — Verify the 6-character code.',
        },
        { status: 404 }
      );
    }

    if (err.message === 'GAME_ALREADY_STARTED') {
      return NextResponse.json(
        {
          success: false,
          error: 'GAME_ALREADY_STARTED',
          message: 'GAME ALREADY STARTED — This room is no longer in the lobby.',
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: err.message || 'FAILED_TO_JOIN' },
      { status: 500 }
    );
  }
}
