import { NextRequest, NextResponse } from 'next/server';
import { readOverlays } from '@/lib/fourPillars/readers/overlaysReader';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const overlays = await readOverlays({
      game_id: searchParams.get('game_id') ?? undefined,
      date: searchParams.get('date') ?? undefined,
      label: searchParams.get('label') ?? undefined,
      moon_sign: searchParams.get('moon_sign') ?? undefined,
    });
    return NextResponse.json({ ok: true, count: overlays.length, overlays });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
