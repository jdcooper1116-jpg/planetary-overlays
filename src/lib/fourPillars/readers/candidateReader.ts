import { getAdminDb } from '@/lib/firebase/admin';
import { serializeDoc } from './pilotConstants';

export type CandidateDoc = Record<string, unknown> & {
  id: string;
};

export interface CandidateFilter {
  status?: string;
  confidence_label?: string;
  pattern_family?: string;
  recommendation?: string;
}

export async function readCandidates(filter: CandidateFilter = {}): Promise<CandidateDoc[]> {
  const db = getAdminDb();

  const snap = await db
    .collection('auto_hypothesis_queue')
    .where('game_id', '==', 'ny_pick3')
    .get();

  let docs: CandidateDoc[] = snap.docs.map((d) => ({
    id: d.id,
    ...(serializeDoc(d.data()) as Record<string, unknown>),
  }));

  if (filter.status) docs = docs.filter((d) => d.status === filter.status);
  if (filter.confidence_label) docs = docs.filter((d) => d.confidence_label === filter.confidence_label);
  if (filter.pattern_family) docs = docs.filter((d) => d.pattern_family === filter.pattern_family);
  if (filter.recommendation) docs = docs.filter((d) => d.last_recommendation === filter.recommendation);

  docs.sort((a, b) => Number(b.confidence_score ?? 0) - Number(a.confidence_score ?? 0));
  return docs;
}

export async function readCandidateById(candidateId: string): Promise<CandidateDoc | null> {
  const db = getAdminDb();

  const raw = String(candidateId ?? '').trim();
  if (!raw) return null;

  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    decoded = raw;
  }

  const idsToTry = Array.from(new Set([raw, decoded].filter(Boolean)));

  // 1. Direct document id lookup
  for (const id of idsToTry) {
    const direct = await db.collection('auto_hypothesis_queue').doc(id).get();
    if (direct.exists) {
      return {
        id: direct.id,
        ...(serializeDoc(direct.data()!) as Record<string, unknown>),
      };
    }
  }

  // 2. Lookup by candidate_id or registry_id fields
  for (const field of ['candidate_id', 'registry_id']) {
    for (const id of idsToTry) {
      const snap = await db
        .collection('auto_hypothesis_queue')
        .where(field, '==', id)
        .limit(1)
        .get();

      if (!snap.empty) {
        const d = snap.docs[0];
        return {
          id: d.id,
          ...(serializeDoc(d.data()) as Record<string, unknown>),
        };
      }
    }
  }

  // 3. Final fallback: scan pilot docs and match any common identifier
  const allSnap = await db
    .collection('auto_hypothesis_queue')
    .where('game_id', '==', 'ny_pick3')
    .get();

  for (const d of allSnap.docs) {
    const row: CandidateDoc = {
      id: d.id,
      ...(serializeDoc(d.data()) as Record<string, unknown>),
    };

    const possibleIds = new Set([
      String(row.id ?? ''),
      String(row.candidate_id ?? ''),
      String(row.registry_id ?? ''),
    ]);

    if (idsToTry.some((id) => possibleIds.has(id))) {
      return row;
    }
  }

  return null;
}

export async function readCandidateStats() {
  const rows = await readCandidates();

  const byStatus: Record<string, number> = {};
  const byConfidence: Record<string, number> = {};
  const byRecommendation: Record<string, number> = {};

  for (const row of rows) {
    const status = String(row.status ?? 'unknown');
    const confidence = String(row.confidence_label ?? 'unknown');
    const recommendation = String(row.last_recommendation ?? 'none');

    byStatus[status] = (byStatus[status] ?? 0) + 1;
    byConfidence[confidence] = (byConfidence[confidence] ?? 0) + 1;
    byRecommendation[recommendation] = (byRecommendation[recommendation] ?? 0) + 1;
  }

  const proposedRegistryCount = rows.filter((r) => r.registry_id).length;

  return {
    total: rows.length,
    byStatus,
    by_status: byStatus,
    byConfidence,
    by_label: byConfidence,
    byRecommendation,
    ready_for_review: rows.filter((r) => r.status === 'ready_for_review').length,
    candidate: rows.filter((r) => r.status === 'candidate').length,
    rejected: rows.filter((r) => r.status === 'rejected').length,
    proposed_registry_count: proposedRegistryCount,
    promoted: proposedRegistryCount,
  };
}
