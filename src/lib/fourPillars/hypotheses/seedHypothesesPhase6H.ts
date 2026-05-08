import { getAdminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { PHASE6H_PICK4_HYPOTHESES } from './starterHypothesesPhase6H';

export async function seedPhase6HPick4Hypotheses(): Promise<{
  seeded: number;
  existing: number;
  ids: string[];
}> {
  const db = getAdminDb();
  let seeded = 0;
  let existing = 0;
  const ids: string[] = [];

  for (const hyp of PHASE6H_PICK4_HYPOTHESES) {
    const ref = db.collection('hypothesis_registry').doc(hyp.hypothesis_id);
    const snap = await ref.get();

    if (!snap.exists) {
      await ref.set({
        ...hyp,
        evidence_count_supporting: 0,
        evidence_count_contradicting: 0,
        evidence_count_neutral: 0,
        evidence_count_total: 0,
        support_rate: null,
        last_tested_at: null,
        created_at: FieldValue.serverTimestamp(),
        updated_at: FieldValue.serverTimestamp(),
      });
      seeded++;
      ids.push(hyp.hypothesis_id);
    } else {
      existing++;
    }
  }

  return { seeded, existing, ids };
}

export function getPhase6HPick4HypothesisIds(): string[] {
  return PHASE6H_PICK4_HYPOTHESES.map((h) => h.hypothesis_id);
}
