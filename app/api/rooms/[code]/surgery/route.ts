import { NextRequest, NextResponse } from 'next/server';
import { roomService } from '@/services/roomService';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const body = await req.json().catch(() => ({}));
    const { playerId } = body;

    const room = roomService.applySurgery(code, playerId || 'unknown');

    return NextResponse.json({
      success: true,
      room,
      gameState: room.gameState,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'SURGERY_FAILED' },
      { status: 500 }
    );
  }
}
