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

  if (!candidateId || !candidateId.trim()) return null;

  const direct = await db.collection('auto_hypothesis_queue').doc(candidateId).get();
  if (direct.exists) {
    return {
      id: direct.id,
      ...(serializeDoc(direct.data()!) as Record<string, unknown>),
    };
  }

  const byField = await db
    .collection('auto_hypothesis_queue')
    .where('candidate_id', '==', candidateId)
    .limit(1)
    .get();

  if (!byField.empty) {
    const d = byField.docs[0];
    return {
      id: d.id,
      ...(serializeDoc(d.data()) as Record<string, unknown>),
    };
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
