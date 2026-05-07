import { getAdminDb } from '@/lib/firebase/admin';
import {
  PILOT_GAME_ID,
  PILOT_DATE_FROM,
  PILOT_DATE_TO,
  serializeDoc,
} from './pilotConstants';

export interface PilotStatus {
  draws_mirrored: number;
  overlays_built: number;
  features_built: number;
  hypotheses_total: number;
  evidence_records: number;
  forecast_runs: number;
  latest_jobs: Record<string, unknown>[];
  latest_forecast: Record<string, unknown> | null;
  recent_draws: Record<string, unknown>[];
}

export async function readPilotStatus(): Promise<PilotStatus> {
  const db = getAdminDb();

  const [
    drawsCount,
    overlaysCount,
    featuresCount,
    hypCount,
    evidenceCount,
    forecastCount,
    jobsSnap,
    forecastSnap,
    recentDrawsSnap,
  ] = await Promise.all([
    db
      .collection('draws')
      .where('game_id', '==', PILOT_GAME_ID)
      .where('draw_date', '>=', PILOT_DATE_FROM)
      .where('draw_date', '<=', PILOT_DATE_TO)
      .count()
      .get(),
    db
      .collection('celestial_overlays')
      .where('game_id', '==', PILOT_GAME_ID)
      .where('draw_date', '>=', PILOT_DATE_FROM)
      .where('draw_date', '<=', PILOT_DATE_TO)
      .count()
      .get(),
    db
      .collection('draw_symbolic_features')
      .where('game_id', '==', PILOT_GAME_ID)
      .where('draw_date', '>=', PILOT_DATE_FROM)
      .where('draw_date', '<=', PILOT_DATE_TO)
      .count()
      .get(),
    db
      .collection('hypothesis_registry')
      .where('game_ids', 'array-contains', PILOT_GAME_ID)
      .count()
      .get(),
    db
      .collection('evidence_tracker')
      .where('game_id', '==', PILOT_GAME_ID)
      .count()
      .get(),
    db
      .collection('forecast_runs')
      .where('game_id', '==', PILOT_GAME_ID)
      .count()
      .get(),
    db.collection('jobs').orderBy('created_at', 'desc').limit(6).get(),
    db
      .collection('forecast_runs')
      .where('game_id', '==', PILOT_GAME_ID)
      .orderBy('generated_at', 'desc')
      .limit(1)
      .get(),
    db
      .collection('draws')
      .where('game_id', '==', PILOT_GAME_ID)
      .where('draw_date', '>=', PILOT_DATE_FROM)
      .where('draw_date', '<=', PILOT_DATE_TO)
      .orderBy('draw_date', 'desc')
      .limit(4)
      .get(),
  ]);

  return {
    draws_mirrored: drawsCount.data().count,
    overlays_built: overlaysCount.data().count,
    features_built: featuresCount.data().count,
    hypotheses_total: hypCount.data().count,
    evidence_records: evidenceCount.data().count,
    forecast_runs: forecastCount.data().count,
    latest_jobs: jobsSnap.docs.map((d) => serializeDoc(d.data())),
    latest_forecast: forecastSnap.empty
      ? null
      : serializeDoc(forecastSnap.docs[0].data()),
    recent_draws: recentDrawsSnap.docs.map((d) => serializeDoc(d.data())),
  };
}
