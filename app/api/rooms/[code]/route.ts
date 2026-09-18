import { NextRequest, NextResponse } from 'next/server';
import { roomService } from '@/services/roomService';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const room = roomService.getRoom(code);

    if (!room) {
      return NextResponse.json(
        { success: false, error: 'ROOM_NOT_FOUND', message: `Room ${code.toUpperCase()} does not exist.` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      room,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}
