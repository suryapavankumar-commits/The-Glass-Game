import { NextRequest, NextResponse } from 'next/server';
import { roomService } from '@/services/roomService';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const room = await roomService.getRoomAsync(code);

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

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const body = await req.json().catch(() => ({}));
    const requesterId = body.requesterId || req.nextUrl.searchParams.get('requesterId');

    if (!requesterId) {
      return NextResponse.json(
        { success: false, error: 'MISSING_REQUESTER_ID', message: 'Host ID required to delete room.' },
        { status: 400 }
      );
    }

    const result = roomService.deleteRoom(code, requesterId);
    return NextResponse.json({
      success: true,
      message: `Room ${code.toUpperCase()} successfully deleted.`,
      result,
    });
  } catch (err: any) {
    const status = err.status || 500;
    return NextResponse.json(
      { success: false, error: err.message || 'SERVER_ERROR' },
      { status }
    );
  }
}
