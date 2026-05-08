import { NextRequest, NextResponse } from 'next/server';
import { seedStarterHypotheses } from '@/lib/fourPillars/hypotheses/seedHypotheses';
import { seedPhase3Hypotheses } from '@/lib/fourPillars/hypotheses/seedHypothesesPhase3';
import { seedPhase6HPick4Hypotheses } from '@/lib/fourPillars/hypotheses/seedHypothesesPhase6H';
import {
  NY_PICK4_GAME_ID,
  PILOT_GAME_ID,
  resolveControlledPilotGameConfig,
} from '@/lib/fourPillars/readers/pilotConstants';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const includePick4 = body.include_pick4 === true || body.game_id === NY_PICK4_GAME_ID;

    if (includePick4) {
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

      const phase6h_pick4 = await seedPhase6HPick4Hypotheses();
      return NextResponse.json({
        ok: true,
        phase6h_pick4,
        total_seeded: phase6h_pick4.seeded,
        total_existing: phase6h_pick4.existing,
      });
    }

    if (body.game_id && body.game_id !== PILOT_GAME_ID) {
      resolveControlledPilotGameConfig(body);
    }

    const [phase1, phase3] = await Promise.all([
      seedStarterHypotheses(),
      seedPhase3Hypotheses(),
    ]);

    return NextResponse.json({
      ok: true,
      phase1,
      phase3,
      total_seeded: phase1.seeded + phase3.seeded,
      total_existing: phase1.existing + phase3.existing,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
