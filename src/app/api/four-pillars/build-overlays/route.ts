import { NextRequest, NextResponse } from 'next/server';
import { buildOverlays } from '@/lib/fourPillars/overlays/buildOverlays';
import { PILOT_DATE_FROM, PILOT_DATE_TO, PILOT_GAME_ID } from '@/lib/fourPillars/readers/pilotConstants';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    const result = await buildOverlays({
      game_id: body.game_id ?? PILOT_GAME_ID,
      date_from: body.date_from ?? PILOT_DATE_FROM,
      date_to: body.date_to ?? PILOT_DATE_TO,
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
