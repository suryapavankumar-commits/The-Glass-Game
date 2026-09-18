import { NextRequest, NextResponse } from 'next/server';
import { roomService } from '@/services/roomService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const hostName = body.hostName || 'Commander Vale';

    const { room, hostPlayer } = roomService.createRoom(hostName);

    return NextResponse.json({
      success: true,
      room,
      hostPlayer,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'FAILED_TO_CREATE_ROOM' },
      { status: 500 }
    );
  }
}
