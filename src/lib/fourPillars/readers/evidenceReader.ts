import { getAdminDb } from '@/lib/firebase/admin';
import { PILOT_GAME_ID, serializeDoc } from './pilotConstants';

export interface EvidenceFilter {
  hypothesis_id?: string;
  result?: string;
  date?: string;
  label?: string;
}

export async function readEvidence(filter: EvidenceFilter = {}): Promise<Record<string, unknown>[]> {
  const db = getAdminDb();

  // Base query — scope to pilot game
  let q = db
    .collection('evidence_tracker')
    .where('game_id', '==', PILOT_GAME_ID)
    .orderBy('draw_date', 'desc')
    .orderBy('hypothesis_id', 'asc');

  // Firestore can only apply one equality filter per field without composite indexes
  // We apply server-side filters where possible, then post-filter the rest
  const snap = await q.get();
  let docs = snap.docs.map((d) => serializeDoc(d.data()));

  if (filter.hypothesis_id) {
    docs = docs.filter((d) => d.hypothesis_id === filter.hypothesis_id);
  }
  if (filter.result) {
    docs = docs.filter((d) => d.result === filter.result);
  }
  if (filter.date) {
    docs = docs.filter((d) => d.draw_date === filter.date);
  }
  if (filter.label) {
    docs = docs.filter((d) => d.draw_label === filter.label);
  }

  return docs;
}
