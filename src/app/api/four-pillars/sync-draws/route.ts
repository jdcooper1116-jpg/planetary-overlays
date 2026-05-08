import { NextRequest, NextResponse } from 'next/server';
import { syncDraws } from '@/lib/fourPillars/sync/syncDraws';
import {
  PILOT_DATE_FROM,
  PILOT_DATE_TO,
  PILOT_ENGINE_GAME,
  PILOT_GAME_ID,
  PILOT_JURISDICTION_ID,
  PILOT_STATE,
} from '@/lib/fourPillars/readers/pilotConstants';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    const result = await syncDraws({
      jurisdiction_id: body.jurisdiction_id ?? PILOT_JURISDICTION_ID,
      game_id: body.game_id ?? PILOT_GAME_ID,
      state: body.state ?? PILOT_STATE,
      game: body.game ?? PILOT_ENGINE_GAME,
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
