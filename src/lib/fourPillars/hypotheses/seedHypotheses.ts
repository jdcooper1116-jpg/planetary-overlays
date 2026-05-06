import { getAdminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { STARTER_HYPOTHESES } from './starterHypotheses';

export async function seedStarterHypotheses(): Promise<{
  seeded: number;
  existing: number;
}> {
  const db = getAdminDb();
  let seeded = 0;
  let existing = 0;

  for (const hyp of STARTER_HYPOTHESES) {
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
    } else {
      existing++;
    }
  }

  return { seeded, existing };
}
