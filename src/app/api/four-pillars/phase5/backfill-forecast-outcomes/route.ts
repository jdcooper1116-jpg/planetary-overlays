import { NextRequest, NextResponse } from 'next/server';
import { backfillForecastOutcomes } from '@/lib/fourPillars/phase5/forecastResolver';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const game_id = body.game_id ?? 'ny_pick3';

    const result = await backfillForecastOutcomes(game_id);
    return NextResponse.json({ ok: true, game_id, ...result });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
