import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';

export async function GET() {
  try {
    const db = getAdminDb();
    const GAME_ID = 'ny_pick3';
    const DATE_FROM = '2024-01-01';
    const DATE_TO = '2024-01-31';

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
      db.collection('jurisdictions').doc('ny').get(),
      db.collection('games').doc(GAME_ID).get(),
      db
        .collection('draws')
        .where('game_id', '==', GAME_ID)
        .where('draw_date', '>=', DATE_FROM)
        .where('draw_date', '<=', DATE_TO)
        .count()
        .get(),
      db
        .collection('celestial_overlays')
        .where('game_id', '==', GAME_ID)
        .where('draw_date', '>=', DATE_FROM)
        .where('draw_date', '<=', DATE_TO)
        .count()
        .get(),
      db
        .collection('draw_symbolic_features')
        .where('game_id', '==', GAME_ID)
        .where('draw_date', '>=', DATE_FROM)
        .where('draw_date', '<=', DATE_TO)
        .count()
        .get(),
      db
        .collection('hypothesis_registry')
        .where('game_ids', 'array-contains', GAME_ID)
        .count()
        .get(),
      db
        .collection('evidence_tracker')
        .where('game_id', '==', GAME_ID)
        .count()
        .get(),
      db
        .collection('forecast_runs')
        .where('game_id', '==', GAME_ID)
        .count()
        .get(),
    ]);

    return NextResponse.json({
      ok: true,
      pilot_scope: {
        game_id: GAME_ID,
        date_from: DATE_FROM,
        date_to: DATE_TO,
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
