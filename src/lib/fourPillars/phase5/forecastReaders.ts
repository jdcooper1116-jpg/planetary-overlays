import { getAdminDb } from '@/lib/firebase/admin';
import { serializeDoc, PILOT_GAME_ID } from '../readers/pilotConstants';
import type { ForecastRun } from './forecastRunTypes';

export async function readAllForecastRuns(
  gameId: string = PILOT_GAME_ID
): Promise<Record<string, unknown>[]> {
  const db = getAdminDb();
  const snap = await db
    .collection('forecast_runs')
    .where('game_id', '==', gameId)
    .orderBy('generated_at', 'desc')
    .get();
  return snap.docs.map((d) => serializeDoc(d.data()));
}

export async function readForecastRunById(
  forecastId: string
): Promise<Record<string, unknown> | null> {
  const db = getAdminDb();
  if (!forecastId || !String(forecastId).trim()) return null;
  const snap = await db.collection('forecast_runs').doc(forecastId).get();
  return snap.exists ? serializeDoc(snap.data()!) : null;
}

export async function readResolvedForecastRuns(
  gameId: string = PILOT_GAME_ID
): Promise<Record<string, unknown>[]> {
  const db = getAdminDb();
  const snap = await db
    .collection('forecast_runs')
    .where('game_id', '==', gameId)
    .where('status', '==', 'resolved')
    .orderBy('generated_at', 'desc')
    .get();
  return snap.docs.map((d) => serializeDoc(d.data()));
}

export async function readForecastSummaryStats(
  gameId: string = PILOT_GAME_ID
): Promise<{
  total: number;
  generated: number;
  resolved: number;
  evidence_backed: number;
  straight_hits: number;
  box_hits: number;
  misses: number;
  hit_rate: number | null;
}> {
  const db = getAdminDb();
  const snap = await db
    .collection('forecast_runs')
    .where('game_id', '==', gameId)
    .get();

  const docs = snap.docs.map((d) => d.data());

  const total = docs.length;
  const generated = docs.filter((d) => d.status === 'generated').length;
  const resolved = docs.filter((d) => d.status === 'resolved').length;
  const evidence_backed = docs.filter((d) => d.evidence_backed === true).length;
  const straight_hits = docs.filter((d) => d.hit_type === 'straight').length;
  const box_hits = docs.filter((d) => d.hit_type === 'box').length;
  const misses = docs.filter((d) => d.hit_type === 'miss').length;
  const total_resolved_with_candidates = docs.filter(
    (d) => d.status === 'resolved' && d.evidence_backed === true
  ).length;
  const hits = straight_hits + box_hits;
  const hit_rate =
    total_resolved_with_candidates > 0
      ? parseFloat((hits / total_resolved_with_candidates).toFixed(4))
      : null;

  return {
    total,
    generated,
    resolved,
    evidence_backed,
    straight_hits,
    box_hits,
    misses,
    hit_rate,
  };
}
