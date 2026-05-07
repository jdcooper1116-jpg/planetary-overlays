import { getAdminDb } from '@/lib/firebase/admin';
import { serializeDoc } from './pilotConstants';

export interface ObservationFilter {
  family?: string;
  lift_gte?: number;
}

export async function readObservations(filter: ObservationFilter = {}) {
  const db = getAdminDb();

  const snap = await db
    .collection('observation_log')
    .where('game_id', '==', 'ny_pick3')
    .get();

  let docs = snap.docs.map((d) => serializeDoc(d.data()));

  const family = filter.family;
  const liftGte = filter.lift_gte;

  if (family) docs = docs.filter((d) => d.pattern_family === family);
  if (liftGte !== undefined) docs = docs.filter((d) => Number(d.lift ?? 0) >= liftGte);

  docs.sort((a, b) => Number(b.lift ?? 0) - Number(a.lift ?? 0));
  return docs;
}

export async function readObservationById(observationId: string) {
  const db = getAdminDb();
  const snap = await db.collection('observation_log').doc(observationId).get();
  return snap.exists ? serializeDoc(snap.data()!) : null;
}

export async function readObservationStats() {
  const rows = await readObservations();

  const byFamily: Record<string, number> = {};
  for (const row of rows) {
    const family = String(row.pattern_family ?? 'unknown');
    byFamily[family] = (byFamily[family] ?? 0) + 1;
  }

  const lifts = rows
    .map((r) => Number(r.lift ?? 0))
    .filter((n) => !Number.isNaN(n))
    .sort((a, b) => a - b);

  const maxLift = lifts.length ? lifts[lifts.length - 1] : 0;
  const medianLift = lifts.length
    ? (lifts.length % 2 === 1
        ? lifts[Math.floor(lifts.length / 2)]
        : (lifts[lifts.length / 2 - 1] + lifts[lifts.length / 2]) / 2)
    : 0;

  return {
    total: rows.length,
    observed: rows.filter((r) => r.candidate_status === 'observed').length,
    families: Object.keys(byFamily).length,
    byFamily,
    by_family: byFamily,
    max_lift: maxLift,
    top_lift: maxLift,
    median_lift: medianLift,
  };
}
