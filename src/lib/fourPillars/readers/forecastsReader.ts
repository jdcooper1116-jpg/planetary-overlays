import { getAdminDb } from '@/lib/firebase/admin';
import { PILOT_GAME_ID, serializeDoc } from './pilotConstants';

export async function readLatestForecast(): Promise<Record<string, unknown> | null> {
  const db = getAdminDb();

  const snap = await db
    .collection('forecast_runs')
    .where('game_id', '==', PILOT_GAME_ID)
    .orderBy('generated_at', 'desc')
    .limit(1)
    .get();

  if (snap.empty) return null;
  return serializeDoc(snap.docs[0].data());
}

export async function readAllForecasts(): Promise<Record<string, unknown>[]> {
  const db = getAdminDb();

  const snap = await db
    .collection('forecast_runs')
    .where('game_id', '==', PILOT_GAME_ID)
    .orderBy('generated_at', 'desc')
    .get();

  return snap.docs.map((d) => serializeDoc(d.data()));
}
