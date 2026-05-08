import { NextRequest, NextResponse } from 'next/server';
import { seedStarterHypotheses } from '@/lib/fourPillars/hypotheses/seedHypotheses';
import { seedPhase6HPick4Hypotheses } from '@/lib/fourPillars/hypotheses/seedHypothesesPhase6H';
import {
  NY_PICK4_GAME_ID,
  resolveControlledPilotGameConfig,
} from '@/lib/fourPillars/readers/pilotConstants';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    if (body.include_pick4 === true || body.game_id === NY_PICK4_GAME_ID) {
      const pilotGame = resolveControlledPilotGameConfig({
        ...body,
        game_id: body.game_id ?? NY_PICK4_GAME_ID,
      });
      if (pilotGame.game_id !== NY_PICK4_GAME_ID) {
        return NextResponse.json(
          { ok: false, error: 'Pick 4 hypothesis seeding requires game_id=ny_pick4.' },
          { status: 400 }
        );
      }

      const result = await seedPhase6HPick4Hypotheses();
      return NextResponse.json({ ok: true, phase6h_pick4: result, ...result });
    }

    const result = await seedStarterHypotheses();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
