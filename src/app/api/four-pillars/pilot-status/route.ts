import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';
import {
  PILOT_JURISDICTION_ID,
  resolveControlledPilotGameConfig,
  resolveControlledPilotDateRange,
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
    const dateRange = resolveControlledPilotDateRange({
      date_from: searchParams.get('date_from') ?? undefined,
      date_to: searchParams.get('date_to') ?? undefined,
      expansion_window_id: searchParams.get('expansion_window_id') ?? undefined,
      game_id: pilotGame.game_id,
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
      evidenceSnap,
      forecastCount,
    ] = await Promise.all([
      db.collection('jurisdictions').doc(PILOT_JURISDICTION_ID).get(),
      db.collection('games').doc(pilotGame.game_id).get(),
      db
        .collection('draws')
        .where('game_id', '==', pilotGame.game_id)
        .where('draw_date', '>=', dateRange.date_from)
        .where('draw_date', '<=', dateRange.date_to)
        .count()
        .get(),
      db
        .collection('celestial_overlays')
        .where('game_id', '==', pilotGame.game_id)
        .where('draw_date', '>=', dateRange.date_from)
        .where('draw_date', '<=', dateRange.date_to)
        .count()
        .get(),
      db
        .collection('draw_symbolic_features')
        .where('game_id', '==', pilotGame.game_id)
        .where('draw_date', '>=', dateRange.date_from)
        .where('draw_date', '<=', dateRange.date_to)
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
        expansion_window_id: dateRange.window_id,
        date_from: dateRange.date_from,
        date_to: dateRange.date_to,
      },
      status: {
        jurisdiction_seeded: jurSnap.exists,
        game_seeded: gameSnap.exists,
        draws_mirrored: drawsCount.data().count,
        overlays_built: overlaysCount.data().count,
        symbolic_features_built: featuresCount.data().count,
        hypotheses_seeded: hypCount.data().count,
        evidence_records: evidenceSnap.docs.filter((doc) => {
          const drawDate = doc.data().draw_date;
          return (
            typeof drawDate === 'string' &&
            drawDate >= dateRange.date_from &&
            drawDate <= dateRange.date_to
          );
        }).length,
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
