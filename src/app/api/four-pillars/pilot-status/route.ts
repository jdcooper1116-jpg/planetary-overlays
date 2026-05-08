import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';
import {
  PILOT_DATE_FROM,
  PILOT_DATE_TO,
  PILOT_JURISDICTION_ID,
  resolveControlledPilotGameConfig,
} from '@/lib/fourPillars/readers/pilotConstants';

export async function GET(req: NextRequest) {
  try {
    const db = getAdminDb();
    const { searchParams } = new URL(req.url);
    const pilotGame = resolveControlledPilotGameConfig({
      game_id: searchParams.get('game_id') ?? undefined,
      game: searchParams.get('game') ?? undefined,
      state: searchParams.get('state') ?? undefined,
      jurisdiction_id: searchParams.get('jurisdiction_id') ?? undefined,
    });

    const [
      jurSnap,
      gameSnap,
      drawsCount,
      overlaysCount,
      featuresCount,
      hypCount,
      evidenceCount,
      forecastCount,
    ] = await Promise.all([
      db.collection('jurisdictions').doc(PILOT_JURISDICTION_ID).get(),
      db.collection('games').doc(pilotGame.game_id).get(),
      db
        .collection('draws')
        .where('game_id', '==', pilotGame.game_id)
        .where('draw_date', '>=', PILOT_DATE_FROM)
        .where('draw_date', '<=', PILOT_DATE_TO)
        .count()
        .get(),
      db
        .collection('celestial_overlays')
        .where('game_id', '==', pilotGame.game_id)
        .where('draw_date', '>=', PILOT_DATE_FROM)
        .where('draw_date', '<=', PILOT_DATE_TO)
        .count()
        .get(),
      db
        .collection('draw_symbolic_features')
        .where('game_id', '==', pilotGame.game_id)
        .where('draw_date', '>=', PILOT_DATE_FROM)
        .where('draw_date', '<=', PILOT_DATE_TO)
        .count()
        .get(),
      db
        .collection('hypothesis_registry')
        .where('game_ids', 'array-contains', pilotGame.game_id)
        .count()
        .get(),
      db
        .collection('evidence_tracker')
        .where('game_id', '==', pilotGame.game_id)
        .count()
        .get(),
      db
        .collection('forecast_runs')
        .where('game_id', '==', pilotGame.game_id)
        .count()
        .get(),
    ]);

    return NextResponse.json({
      ok: true,
      pilot_scope: {
        game_id: pilotGame.game_id,
        engine_game: pilotGame.engine_game,
        date_from: PILOT_DATE_FROM,
        date_to: PILOT_DATE_TO,
      },
      status: {
        jurisdiction_seeded: jurSnap.exists,
        game_seeded: gameSnap.exists,
        draws_mirrored: drawsCount.data().count,
        overlays_built: overlaysCount.data().count,
        symbolic_features_built: featuresCount.data().count,
        hypotheses_seeded: hypCount.data().count,
        evidence_records: evidenceCount.data().count,
        forecast_runs: forecastCount.data().count,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
