import { NextResponse } from 'next/server';
import { buildOverlays } from '@/lib/fourPillars/overlays/buildOverlays';

export async function POST() {
  try {
    const result = await buildOverlays({
      game_id: 'ny_pick3',
      date_from: '2024-01-01',
      date_to: '2024-01-31',
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
