import { NextRequest, NextResponse } from 'next/server';
import { syncDraws } from '@/lib/fourPillars/sync/syncDraws';
import {
  resolveControlledPilotDateRange,
  resolveControlledPilotGameConfig,
} from '@/lib/fourPillars/readers/pilotConstants';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const pilotGame = resolveControlledPilotGameConfig(body);
    const dateRange = resolveControlledPilotDateRange(body);

    const result = await syncDraws({
      jurisdiction_id: pilotGame.jurisdiction_id,
      game_id: pilotGame.game_id,
      state: pilotGame.state,
      game: pilotGame.engine_game,
      date_from: dateRange.date_from,
      date_to: dateRange.date_to,
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
